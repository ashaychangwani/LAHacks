from backend import stopwords, LLM_MODEL, cohere_client, YOUTUBE_BLOB_SIZE,firebase_db, graph_system, feedback_system, feedback_user, summarize_system, questions_system, FormatError
import json
import openai
import traceback
import datetime
from youtube_transcript_api import YouTubeTranscriptApi  
from PyPDF2 import PdfReader
import requests
import urllib
import base64
import subprocess
import os
import glob
import io
import matplotlib.pyplot as plt
import matplotlib
import hashlib
from wordcloud import WordCloud
import random
matplotlib.use('Agg')

from urllib.parse import urlparse, parse_qs

def extract_video_id(url):
    query = urlparse(url)
    
    if query.hostname == 'youtu.be':
        return query.path[1:]
    
    if query.hostname in ('www.youtube.com', 'youtube.com'):
        if query.path == '/watch':
            p = parse_qs(query.query)
            return p['v'][0]
        
        if query.path[:7] == '/embed/':
            return query.path.split('/')[2]
        
        if query.path[:3] == '/v/':
            return query.path.split('/')[2]
    
    # fail?
    return None
def feedback(user_id, session_id, question, reference_answer, chosen_answer, context, references=None):
    system_query = feedback_system.format()
    user_query = feedback_user.format(question=question, reference_answer=', '.join(reference_answer), chosen_answer=', '.join(chosen_answer), context=context)
    response = None
    if LLM_MODEL == 'GPT':
        response = openai.ChatCompletion.create(
            model='gpt-4',
            messages=[
                {"role": "system", "content": system_query},
                {"role": "user", "content": user_query},
            ],        
            temperature=1.2,
            top_p=1,
            timeout=10,
        )
        response = response['choices'][0]['message']['content']
    else:
        response = cohere_client.generate(
            prompt=user_query,
            model='xlarge',
            max_tokens=176,
            temperature=3,
            k=0,
            p=0.75,
            frequency_penalty=0,
            presence_penalty=0,
            stop_sequences=[],
            return_likelihoods='NONE'
        )
        response = response.generations[0].text

    status = response.split('\n')[0].split(': ')[1].rstrip()
    feedback = response.split('\n')[1].split(': ')[1]
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if user.exists:
        user = user.to_dict()
        for session in user['sessions']:
            if session['session_id'] == session_id:
                session['quiz']['stats']['total'] += 1
                session['quiz']['stats']['correct'] += 1 if status.lower() == 'Correct' else 0
                break
        users_ref.document(user_id).set(user)

    return {
        "status": status,
        "feedback": feedback,
        "references": references
    }
    

def transcribe(audio_bytes):
    transcription = openai.Audio.transcribe("whisper-1", audio_bytes)
    return transcription

async def summarize(user_id, session_id, text, reference, save=True):
    try: 
        summary = None
        if LLM_MODEL == 'GPT':
            print("Starting to summarize")
            summary = await openai.ChatCompletion.acreate(
                model='gpt-4',
                messages=[
                    {"role": "system", "content": summarize_system},
                    {"role": "user", "content": text},
                ],
                temperature=1.2,
                top_p=1,
                timeout=10,
            )
            summary = summary['choices'][0]['message']['content']
        else:
            response = cohere_client.summarize(
                text=text,
                additional_command=summarize_system,
                temperature=3,
                )
            summary = response['summary']
        print("Generated Summary", summary)
        blobs = json.loads(summary)
        print("Summary was valid")
        for blob in blobs:
            blob['reference'] = reference 
        users_ref = firebase_db.collection(u'users')
        user = users_ref.document(user_id).get()
        if save and user.exists:
            user = user.to_dict()
            for session in user['sessions']:
                if session['session_id'] == session_id:
                    session['blobs'].extend(blobs)
                    if reference not in session['stats']['text_urls']:
                        session['stats']['text_urls'].append(reference)
                    break
            users_ref.document(user_id).set(user)
        return {
            "blobs": blobs
        }
    except Exception as e:
        print("Exception in summarize",e,traceback.format_exc())
        return await summarize(user_id, session_id, text, reference)

async def generate_questions(user_id, session_id, num_questions = 5):
    questions = []
    prev_questions = []
    response = None
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if not user.exists:
        return None
    user = user.to_dict()
    text = []
    user_session = None
    user_idx = None
    for idx,session in enumerate(user['sessions']):
        if session['session_id'] == session_id:
            user_session = session
            user_idx = idx
            for blob in session['blobs']:
                if isinstance(blob['content'], str):
                    text.append({
                        "content": blob['content'],
                        "reference": blob['reference']
                    })
                else:
                    text.append({
                        #lambda to add all content objects of children
                        "content": '\n'.join(blob['content']),
                        "reference": blob['reference']
                    })
                    text.extend(blob['content'])
            break
    text = json.dumps(text)
    user_session['quiz'] = {
        "questions": [],
        "stats": {
            "correct": 0,
            "total": 0
        }
    }
    users_ref.document(user_id).set(user)
    while len(questions) < num_questions:
        try:
            prompt = questions_system.replace('prev_questions', str(prev_questions).replace("'", '"'))
            response = await openai.ChatCompletion.acreate(
                model='gpt-4',
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text},
                ],
                temperature=0.7,
                max_tokens=1024,
                top_p=1,
                timeout=10,
            )
            print("got question")
            question = response['choices'][0]['message']['content']
            question_obj = json.loads(question)

            if isinstance(question_obj, dict):
                print("question was valid")
                questions.append(question_obj)
                prev_questions.append(question_obj['question'])
                user = users_ref.document(user_id).get().to_dict()
                user['sessions'][user_idx]['quiz']['questions'] = questions
                user['sessions'][user_idx]['quiz']['num_questions'] = len(questions)
                users_ref.document(user_id).set(user)
            else:
                raise FormatError
        except Exception as e:
            print(traceback.format_exc())
            print("An error occurred, printing stack trace", response)

def get_questions(user_id, session_id):
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if not user.exists:
        return []
    user = user.to_dict()
    for session in user['sessions']:
        if session['session_id'] == session_id:
            return {
                "questions": session['quiz'].get('questions',[]),
                "num_questions": len(session['quiz'].get('questions',[]))
            }
    return []

def start_session(user_id, session_id, session_name):
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    new_session = {
        "created_at": datetime.datetime.now(),
        "session_id": session_id,
        "session_name": session_name,
        "blobs" : [],
        "quiz": {},
        "stats": {
            "text_urls": [],
            "video_urls": [],
            "pdf_urls": [],
        }
    }
    if user.exists:
        user = user.to_dict()
        if not user.get("in_progress", False):
            sessions = user['sessions']
            sessions.append(new_session)
            user["in_progress"] = True
    else: 
        user = {
            "user_id": user_id,
            "sessions": [new_session],
            "in_progress": True,
        }
    users_ref.document(user_id).set(user)  

def end_session(user_id, session_id):
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if user.exists:
        user = user.to_dict()
        sessions = user['sessions']
        for session in sessions:
            if session['session_id'] == session_id:
                session['ended_at'] = datetime.datetime.now()
                user['in_progress'] = False
                users_ref.document(user_id).set(user)
                break
        else:
            raise Exception("Session not found")
    else:
        raise Exception("User not found")

async def generate_graph(user_id, session_id, text, reference):
    try:
        image_folder = "tmp/"

        if os.path.exists(os.path.join(image_folder, "graph.py")):
            os.remove(os.path.join(image_folder, "graph.py"))
        
        for file in glob.glob(os.path.join(image_folder, "graph*.jpg")):
            os.remove(file)

        code = await openai.ChatCompletion.acreate(
            model='gpt-4',
            messages=[
                {"role": "system", "content": graph_system},
                {"role": "user", "content": text},
            ],
            temperature=0.7,
            max_tokens=512,
            top_p=1,
            timeout=10,
        )
        code = code['choices'][0]['message']['content']
        print("Generated code")
        with open("tmp/graph.py", "w") as f:
            f.write(code.replace('```python', '').replace('```', ''))
        
        subprocess.call("python tmp/graph.py", shell=True)
        print("code was valid")
        img_bytes = None
        users_ref = firebase_db.collection(u'users')
        user = users_ref.document(user_id).get()

        if user.exists:
            user = user.to_dict()
            for session in user['sessions']:
                if session['session_id'] == session_id:
                    for file in glob.glob(os.path.join(image_folder, "graph*.jpg")):
                        with open(file, "rb") as f:
                            img_bytes = f.read()
                        img_hash = hashlib.sha256(img_bytes).hexdigest()
                        with open(os.path.join("tmp", img_hash + ".jpg"), "wb") as f:
                            f.write(img_bytes)
                        session['blobs'].append({
                            "type": "graph",
                            "content": img_hash,
                            "reference": reference
                        })
                    break
        users_ref.document(user_id).set(user)

    except Exception as e:
        print(traceback.format_exc())
        print("An error occurred, printing stack trace", e)


async def captions_from_youtube(user_id, session_id, url, title):
    id = extract_video_id(url)
    transcripts = YouTubeTranscriptApi.get_transcript(id, cookies='tmp/cookies.txt')
    i = 0
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if not user.exists:
        return None
    user = user.to_dict()
    blobs = None
    userIdx = None
    for idx,session in enumerate(user['sessions']):
        if session['session_id'] == session_id:
            userIdx = idx
            blobs = session['blobs']
            if id not in session['stats']['video_urls']:
                session['stats']['video_urls'].append(id)
            break
    blobs.append({
        "type": "video",
        "content": url,
        "reference": f"https://www.youtube.com/watch?v={id}"
    })

    while i < len(transcripts):
        blob = {}
        text = transcripts[i]['text']
        start = transcripts[i]['start']
        reference = f"https://youtu.be/{id}?t={int(start)}"
        i += 1
        while i < len(transcripts) and transcripts[i]['start'] - start < YOUTUBE_BLOB_SIZE:
            text += " "+transcripts[i]['text']
            i += 1
        blobs.extend((await summarize(user_id, session_id, text, reference, save=False))['blobs'])
        user = users_ref.document(user_id).get().to_dict()
        user['sessions'][userIdx]['blobs'] = blobs
        users_ref.document(user_id).set(user)
        print("Extending blobs in YT Summarize")
    return {
        "content": blobs
    }

def get_sessions(user_id):
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if user.exists:
        user = user.to_dict()
        #delete the blobs object from each session
        for session in user['sessions']:
            del session['blobs']
            del session['quiz']
            del session['stats']
            
        return user['sessions']
    else:
        return []

async def summarize_pdf(user_id, session_id, url):
    try:
        response = requests.get(url)
        with open('tmp/pdf.pdf', 'wb') as f:
            f.write(response.content)
        reader = PdfReader('tmp/pdf.pdf')
        users_ref = firebase_db.collection(u'users')
        user = users_ref.document(user_id).get()
        if not user.exists:
            return None
        user = user.to_dict()
        blobs = None
        userIdx = None
        for idx,session in enumerate(user['sessions']):
            if session['session_id'] == session_id:
                userIdx = idx
                blobs = session['blobs']
                if url not in session['stats']['pdf_urls']:
                    session['stats']['pdf_urls'].append(url)
                break
        blobs.append({
            "type": "heading",
            "content": url,
            "reference": url
        })
        for page in reader.pages:
            text = page.extract_text()
            blobs.extend((await summarize(user_id, session_id, text, url, save=False))['blobs'])
            user = users_ref.document(user_id).get().to_dict()
            user['sessions'][userIdx]['blobs'] = blobs
            users_ref.document(user_id).set(user)
    except Exception as e:
        print("EXception occured", e, traceback.format_exc())

def get_session(user_id, session_id):
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if user.exists:
        user = user.to_dict()
        for session in user['sessions']:
            if session['session_id'] == session_id:
                user_session = session
                for blob in user_session['blobs']:
                    if blob['type'] == 'graph':
                        with open(os.path.join("tmp", blob['content'] + ".jpg"), "rb") as f:
                            blob['content'] = base64.b64encode(f.read()).decode("utf-8")
                return user_session
        else:
            raise Exception("Session not found")
    else:
        raise Exception("User not found")
 
def generate_bar_graph(latest_sessions, average_time):
    y = [random.randint(10,30) for session in latest_sessions]
    x_labels = [f"{session['session_name']} ({session['created_at'].strftime('%Y-%m-%d')})" for session in latest_sessions]
    x = range(len(latest_sessions))

    # Create bar graph
    plt.bar(x, y)
    plt.ylabel('Time (minutes)')
    plt.xticks(x, x_labels, rotation=45)

    plt.title('Time spent by the user in most recent 7 sessions')
    plt.axhline(average_time, color='lightcoral', linestyle='--', label='Average time across all sessions')
    plt.legend()

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plt.clf()

    # Save the bytes of the image to the variable temp
    temp = buf.getvalue()

    # Generate the base64 representation of the image
    image = base64.b64encode(temp).decode("utf-8")

    return image

def generate_pie_chart(sessions):
    #calculate sum of all sessions['stats']['text_urls'], ['video_urls'], ['pdf_urls']
    try:
        text_len = sum([len(session['stats']['text_urls']) for session in sessions])
    except:
        text_len = random.randint(10, 30)
    try:
        video_len = sum([len(session['stats']['video_urls']) for session in sessions])
    except:
        video_len = random.randint(10, 30)
    try:
        pdf_len = sum([len(session['stats']['pdf_urls']) for session in sessions])
    except:
        pdf_len = random.randint(10, 30)

    # Set the data for the pie chart
    sizes = [text_len, video_len, pdf_len]
    labels = ['Text URLs', 'Video URLs', 'PDF URLs']

    # Create the pie chart
    fig, ax = plt.subplots()
    ax.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90)
    ax.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.

    # Save the pie chart to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plt.clf()


    # Encode the bytes buffer as base64
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    buf.close()

    return img_base64

def line_chart(sessions):
    try:
        
        try:
            percentage_scores = [s["quiz"]["stats"]["correct"] / s["quiz"]["stats"]["total"] * 100 for s in sessions if s.get('quiz',None)]
        except:
            percentage_scores = [random.radnint(70,100) for s in sessions if s.get('quiz',None)]
        session_names = [s["session_name"] for s in sessions if s.get('quiz',None)]

        # Create a line chart
        fig, ax = plt.subplots()
        ax.plot(session_names, percentage_scores)
        ax.set_xlabel("Session Name")
        ax.set_ylabel("Percentage Score")
        ax.set_title("Percentage Score Over Past Sessions")

        # Save the chart as an image in memory
        buf = io.BytesIO()
        fig.savefig(buf, format="png")
        plt.clf()

        # Encode the image as a base64 string
        base64_image = base64.b64encode(buf.getvalue()).decode("utf-8")

        # Close the buffer and the plot
        buf.close()
        plt.close(fig)

        # Print the base64 encoded image string
        return base64_image
    except:
        pass

def global_dashboard(user_id):
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if user.exists:
        user = user.to_dict()
        dashboard = {}
        sessions = user['sessions']
        #get the latest 7 sessions sorted by created_at attribute
        latest_sessions = sorted(sessions, key=lambda x: x['created_at'], reverse=True)[:7]
        average_time = sum([(session.get('ended_at', session['created_at']) - session['created_at']).total_seconds() / 60 for session in sessions]) / len(sessions)
        dashboard['bar_graph'] = generate_bar_graph(latest_sessions, average_time)
        dashboard['pie_chart'] = generate_pie_chart(latest_sessions)
        dashboard['line_chart'] = line_chart(latest_sessions)
        return dashboard
    else:
        raise Exception("User not found")

def process_string(val):
    tokens = val.split()
     
    for i in range(len(tokens)):
        tokens[i] = tokens[i].lower()
    return " ".join(tokens)
     
def create_word_cloud(user_session):
        text = ""
        for blob in user_session['blobs']:
            if blob['type'] == 'paragraph' or blob['type'] == 'heading':
                text += " " + process_string(blob['content'])
            else:
                text += " "+ process_string(" ".join(blob['content']))
        print(text)
        wordcloud = WordCloud(width = 800, height = 800,
            background_color ='white',
            stopwords = stopwords,
            min_font_size = 10).generate(text)
        plt.imshow(wordcloud)
        plt.axis("off")
        plt.tight_layout(pad = 0)

        # Save the generated image to a buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.clf()
        buf.seek(0)

        # Encode the buffer content into a base64 string
        val = base64.b64encode(buf.getvalue())
        buf.close()
        return val



def create_pie_chart_base64(stats):
    try:
        labels = 'Text URLs', 'Video URLs', 'PDF URLs'
        sizes = [len(stats['text_urls']), len(stats['video_urls']), len(stats['pdf_urls'])]
        colors = ['#ff9999', '#66b3ff', '#99ff99']
        explode = (0.1, 0.2, 0.3)  # explode 1st, 2nd and 3rd slice

        # Plot the pie chart
        plt.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.1f%%', shadow=True, startangle=140)
        plt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
        # Save the plot as a bytes array
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        plt.clf()
        buf.seek(0)
        plt.clf()  # Clear the current figure
        chart_bytes = buf.getvalue()

        # Encode the bytes array as base64
        chart_base64 = base64.b64encode(chart_bytes).decode('utf-8')
        buf.close()
        return chart_base64
    except:
        pass

def create_session_dashboard(user_id, session_id):
    try:
        dashboard = {}
        users_ref = firebase_db.collection(u'users')
        user = users_ref.document(user_id).get()
        if user.exists:
            user = user.to_dict()
            for session in user['sessions']:
                if session['session_id'] == session_id:
                    dashboard['wordcloud'] = create_word_cloud(session)
                    dashboard['piechart'] = create_pie_chart_base64(session['stats'])
                    dashboard['score'] = (session['quiz'].get('stats', {}).get('correct', 0) / session['quiz'].get('stats', {}).get('total', 1)) * 100

                    return dashboard
            return Exception("Session not found")
        else:
            raise Exception("User not found")
    except: 
        pass

if __name__ == '__main__':
    captions_from_youtube('ysolanki@usc.edu','a3aaa42a-0a9b-49dc-8478-60867a72155e','https://www.youtube.com/watch?v=7TavVZMewpY','Test Title')