from fastapi import FastAPI, UploadFile, File
from backend import brain
from pydantic import BaseModel
import os



class Feedback(BaseModel):
    question: str
    reference_answer: str
    chosen_answer: str
    context: str
    references: list | None

class RawText(BaseModel):
    text: str
    source: str | None
    user_id: str
    session_id: str

class Context(BaseModel):
    text: str

class Session(BaseModel):
    session_id: str
    user_id: str

class Content(BaseModel):
    session_id: str
    user_id: str
    content: str
    reference_url: str

app = FastAPI()

@app.get('/')
async def status():
    return {"status": "ok"} 


@app.post('/feedback')
async def feedback(feedback: Feedback):
    feedback = brain.feedback(feedback.question, feedback.reference_answer, feedback.chosen_answer, feedback.context, feedback.references)
    return feedback


@app.post("/transcribe")
def transcribe_audio(file: UploadFile = File(...)):
    contents = file.file.read()
    with open(os.path.join('tmp',file.filename), 'wb') as f:
        f.write(contents)
    audio_file= open(os.path.join('tmp',file.filename), "rb")
    transcription = brain.transcribe(audio_file)
    return transcription

@app.post("/summarize")
def summarize_text(rawText: RawText):
    summary = brain.summarize(rawText.user_id, rawText.session_id, rawText.text, rawText.source)
    return summary

@app.post("/questions")
def generate_questions(context: Context, num_questions: int = 5):
    questions = brain.generate_questions(context.text, num_questions)
    return questions

@app.get("/start-session")
def start_session(session: Session):
    brain.start_session(session.user_id, session.session_id)
    return {"status": "ok"}

@app.get("/end-session")
def end_session(session: Session):  
    brain.end_session(session.user_id, session.session_id)
    return {"status": "ok"}

