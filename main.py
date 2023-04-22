from fastapi import FastAPI, UploadFile, File, Request
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

class YouTubeSession(Session):
    url: str
    title: str

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
    """Provide feedback for each answered question

    Args:
        feedback (Feedback): 
            question (str): The question that was asked
            reference_answer (list[str]): The correct answer (1 or more in case of MultipleAnswer type)
            chosen_answer (list[str]): The answer that was chosen (1 or more in case of MultipleAnswer type)
            context (str): The context of the question
            references (list[str]): The references used to answer the question

    Returns:
        Dict: 
            status (str): The status of the operation. Will be Correct or Incorrect
            feedback (str): The feedback for the question and their answer
            references (list[str]): The references used to answer the question, to be shown with feedback

    """
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
def generate_questions(session: Session, num_questions: int = 5):
    questions = brain.generate_questions(session.user_id, session.session_id)
    return questions

@app.get("/start-session")
def start_session(user_id, session_id):
    brain.start_session(user_id, session_id)
    return {"status": "ok"}

@app.get("/end-session")
def end_session(user_id, session_id):  
    brain.end_session(user_id, session_id)
    return {"status": "ok"}

@app.post("/yt-summarize")
def yt_summarize(ytSession: YouTubeSession):
    summary = brain.captions_from_youtube(ytSession.user_id, ytSession.session_id, ytSession.url, ytSession.title)
    return {"status": "ok"}

@app.get("/get-sessions")
def get_sessions(user_id):
    sessions = brain.get_sessions(user_id)
    return sessions

@app.get("/get-session")
def get_session(user_id, session_id):
    session = brain.get_session(user_id, session_id)
    return session

@app.post('/graph')
def graph(content: Content):
    graph = brain.generate_graph(content.user_id, content.session_id, content.content, content.reference_url)
    return graph

@app.post("/update-github-repo")
async def update_github_repo(request: Request) -> dict:
    """
    Updates local git repository with the latest changes from the remote repository.

    Args:
        request (Request): GitHub webhook secret.

    Returns:
        dict: A dictionary with a "message" key, detailing the result of the operation.

    TODO: Add logging
    """

    os.system("git pull")
    return {"message": "Updated successfully"}

