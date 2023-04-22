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

class Context(BaseModel):
    text: str

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
    summary = brain.summarize(rawText.text)
    return summary

@app.post("/questions")
def generate_questions(context: Context, num_questions: int = 5):
    questions = brain.generate_questions(context.text, num_questions)
    print(questions)
    return questions