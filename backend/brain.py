from backend import firebase_db, feedback_system, feedback_user, summarize_system, questions_system, FormatError
import json
import openai
import traceback
import datetime
from youtube_transcript_api import YouTubeTranscriptApi  
from PyPDF2 import PdfReader
import requests
import urllib
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
        "feedback": feedback
    }
    

def transcribe(audio_bytes):
    transcription = openai.Audio.transcribe("whisper-1", audio_bytes)
    return transcription

def summarize(user_id, session_id, text, reference, save=True):
    try:
        summary = openai.ChatCompletion.create(
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
        return summarize(user_id, session_id, text, reference)

def generate_questions(user_id, session_id, num_questions = 5):
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
    while len(questions) < num_questions:
        try:
            prompt = questions_system.replace('prev_questions', str(prev_questions).replace("'", '"'))
            response = openai.ChatCompletion.create(
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

            question = response['choices'][0]['message']['content']
            question_obj = json.loads(question)

            if isinstance(question_obj, dict):
                questions.append(question_obj)
                prev_questions.append(question_obj['question'])
            else:
                raise FormatError
        except Exception as e:
            print(traceback.format_exc())
            print("An error occurred, printing stack trace", response)
    user_session['quiz'] = {}
    user_session['quiz']['questions'] = questions
    #set the session in user
    users_ref.document(user_id).set(user)

    return {
        "questions": questions
    }

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

def captions_from_youtube(user_id, session_id, url, title):
    id = extract_video_id(url)
    transcripts = YouTubeTranscriptApi.get_transcript(id, cookies='tmp/cookies.txt')
    i = 0
    blobs = [{
        "type": "heading",
        "content": title,
        "reference": f"https://www.youtube.com/watch?v={id}"
    }]
    while i < len(transcripts):
        blob = {}
        text = transcripts[i]['text']
        start = transcripts[i]['start']
        reference = f"https://youtu.be/{id}?t={int(start)}"
        i += 1
        while i < len(transcripts) and transcripts[i]['start'] - start < YOUTUBE_BLOB_SIZE:
            text += " "+transcripts[i]['text']
            i += 1
        blobs.extend(summarize(user_id, session_id, text, reference, save=False)['blobs'])

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
        text = textract.process('tmp/pdf.pdf').decode("utf-8")
        return summarize(user_id, session_id, text, url)
    except Exception as e:
        print("EXception occured", e, traceback.format_exc())

if __name__ == '__main__':
    captions_from_youtube(
	user_id= "1",
	session_id= "1",
	url= "https://www.youtube.com/watch?v=jKF5GtBIxpM",
	title= "The open source alternative to my sponsor - Jellyfin vs Plex"
)