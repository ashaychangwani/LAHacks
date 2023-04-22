from backend import YOUTUBE_BLOB_SIZE,firebase_db, graph_system, feedback_system, feedback_user, summarize_system, questions_system, FormatError
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
def feedback(question, reference_answer, chosen_answer, context, references=None):
    system_query = feedback_system.format()
    user_query = feedback_user.format(question=question, reference_answer=reference_answer, chosen_answer=chosen_answer, context=context)
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

    status = response.split('\n')[0].split(': ')[1]
    feedback = response.split('\n')[1].split(': ')[1]
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
        print("Generated Summary")
        blobs = json.loads(summary)
        for blob in blobs:
            blob['reference'] = reference 
        users_ref = firebase_db.collection(u'users')
        user = users_ref.document(user_id).get()
        if save and user.exists:
            user = user.to_dict()
            for session in user['sessions']:
                if session['session_id'] == session_id:
                    session['blobs'].extend(blobs)
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
    for session in user['sessions']:
        if session['session_id'] == session_id:
            user_session = session
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
    user_session['quiz'] = {}
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
                user_session['quiz']['questions'] = questions
                user_session['quiz']['num_questions'] = len(questions)
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
                "questions": session['quiz']['questions'],
                "num_questions": len(session['quiz']['questions'])
            }
    return []

def start_session(user_id, session_id):
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    new_session = {
        "created_at": datetime.datetime.now(),
        "session_id": session_id,
        "blobs" : [],
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

def generate_graph(user_id, session_id, text, reference):
    try:
        code = openai.ChatCompletion.create(
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
        with open("tmp/graph.py", "w") as f:
            f.write(code)
        
        subprocess.call("python tmp/graph.py", shell=True)

        # Load the graph image into a byte array
        img_bytes = None
        with open("tmp/graph.jpg", "rb") as f:
            img_bytes = f.read()

        image = base64.b64encode(img_bytes).decode("utf-8")
        users_ref = firebase_db.collection(u'users')
        user = users_ref.document(user_id).get()
        if user.exists:
            user = user.to_dict()
            for session in user['sessions']:
                if session['session_id'] == session_id:
                    session['blobs'].append({
                        "type": "graph",
                        "content": image,
                        "reference": reference
                    }) 
                    break
            users_ref.document(user_id).set(user)
        return {
            "image": image
        }
    except Exception as e:
        print(traceback.format_exc())
        print("An error occurred, printing stack trace", e)
        return None


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
    for session in user['sessions']:
        if session['session_id'] == session_id:
            blobs = session['blobs']
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
            
        return user['sessions']
    else:
        return []

def summarize_pdf(user_id, session_id, url):
    try:
        response = requests.get(url)
        with open('tmp/pdf.pdf', 'wb') as f:
            f.write(response.content)
        reader = PdfReader('tmp/pdf.pdf')
        blobs = [{
            "type": "heading",
            "content": url,
            "reference": url
        }]
        for page in reader.pages:
            text = page.extract_text()
            blobs.extend(summarize(user_id, session_id, text, url, save=False))
        users_ref = firebase_db.collection(u'users')
        user = users_ref.document(user_id).get()
        if user.exists:
            user = user.to_dict()
            for session in user['sessions']:
                if session['session_id'] == session_id:
                    session['blobs'].extend(blobs)
                    break
            users_ref.document(user_id).set(user)
        return {
            "content": blobs
        }
    except Exception as e:
        print("EXception occured", e, traceback.format_exc())

def get_session(user_id, session_id):
    users_ref = firebase_db.collection(u'users')
    user = users_ref.document(user_id).get()
    if user.exists:
        user = user.to_dict()
        for session in user['sessions']:
            if session['session_id'] == session_id:
                return session
        else:
            raise Exception("Session not found")
    else:
        raise Exception("User not found")

if __name__ == '__main__':
    summarize_pdf('1', '1', 'https://www.cms.gov/About-CMS/Agency-Information/OMH/Downloads/MMDT-Quick-Start-Guide.pdf')