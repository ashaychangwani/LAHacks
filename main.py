from fastapi import FastAPI, UploadFile, File, Request
from backend import brain
from pydantic import BaseModel
import os
import asyncio
from fastapi.middleware.cors import CORSMiddleware



class Feedback(BaseModel):
    user_id: str
    session_id: str
    question: str
    reference_answer: list
    chosen_answer: list
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

class PDFSession(Session):
    url: str

class Content(BaseModel):
    session_id: str
    user_id: str
    content: str
    reference_url: str

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
async def status():
    return {"status": "ok"} 


@app.post('/feedback')
async def feedback(feedback: Feedback):
    """Provide feedback for each answered question

    Args:
        feedback (Feedback): 
            user_id (str): The user id
            session_id (str): The session id
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
    feedback = brain.feedback(feedback.user_id, feedback.session_id, feedback.question, feedback.reference_answer, feedback.chosen_answer, feedback.context, feedback.references)
    return feedback


@app.post("/transcribe")
def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe Audio Into Text

    Args:
        file (Audio File): _description_. Defaults to File(...).

    Returns:
        dict: 
            text (str): The transcribed text
    """
    contents = file.file.read()
    with open(os.path.join('tmp',file.filename), 'wb') as f:
        f.write(contents)
    audio_file= open(os.path.join('tmp',file.filename), "rb")
    transcription = brain.transcribe(audio_file)
    return transcription

@app.post("/summarize")
async def summarize_text(rawText: RawText):
    """Summarize the given text

    Args:
        rawText (RawText): dict
            text (str): The text to summarize
            source (str): The source URL of the text
            user_id (str): The user id
            session_id (str): The session id

    Returns:
        dict: 
            status (str): The status of the operation. Will be ok
    """
    asyncio.create_task(brain.summarize(rawText.user_id, rawText.session_id, rawText.text, rawText.source))
    return {"status": "ok"}

@app.post("/generate-questions")
async def generate_questions(session: Session, num_questions: int = 5):
    """Start generating questions for the session

    Args:
        session (Session): Session Object
            session_id (str): The session id
            user_id (str): The user id

        num_questions (int, optional): _description_. Defaults to 10.

    Returns:
        dict: 
            status (str): The status of the operation. Will be ok
    """
    asyncio.create_task(brain.generate_questions(session.user_id, session.session_id))
    return {"status": "ok"}

@app.get("/questions")
def get_questions(user_id, session_id):
    """Get the questions for a Session

    Args:
        user_id (str): User ID
        session_id (str): Session ID

    Returns:
        dict: 
            questions (list[dict]): List of questions
            num_questions (int): Number of questions
        question:
            "question_type": <type of question: MultipleAnswer OR MultipleChoice ORShortAnswer>,
            "question": <question: string>,
            "answer": <1 or more correct answers: array>,
            "options": <list of options for MultipleChoice and MultipleAnswer: array>,
            "context": <50-75 words of context: string>,
            "references": <list of references of the context>
    """
    questions = brain.get_questions(user_id, session_id)
    return questions

@app.get("/start-session")
def start_session(user_id, session_id, session_name="Temp Name"):
    """Start a new Session

    Args:
        user_id (str)
        session_id (str)
        session_name (str)

    Returns:
        dict:
            status (str): The status of the operation. Will be ok
    """
    brain.start_session(user_id, session_id, session_name)
    return {"status": "ok"}

@app.get("/end-session")
def end_session(user_id, session_id):  
    """End a Session

    Args:
        user_id (str)
        session_id (str)

    Returns:
        dict:
            status (str): The status of the operation. Will be ok
    """
    brain.end_session(user_id, session_id)
    return {"status": "ok"}

@app.post("/yt-summarize")
async def yt_summarize(ytSession: YouTubeSession):
    """Generate Summary for a YouTube video

    Args:
        ytSession (YouTubeSession): dict
            user_id (str): The user id
            session_id (str): The session id
            url (str): The YouTube URL
            title (str): The title of the video

    Returns:
        dict:
            status (str): The status of the operation. Will be ok

    """
    asyncio.create_task(brain.captions_from_youtube(ytSession.user_id, ytSession.session_id, ytSession.url, ytSession.title))
    return {"status": "ok"}

@app.get("/get-sessions")
def get_sessions(user_id):
    """Get all Sessions for a user

    Args:
        user_id (str): user_id

    Returns:
        list[sessions]: List of sessions
        session:
            "session_id": <session_id: string>,
            "session_name": <session_name: string>,
            "created_at": <start_time: datetime>,
            "ended_at": <end_time: datetime>,
    """
    sessions = brain.get_sessions(user_id)
    return sessions

@app.get("/get-session")
def get_session(user_id, session_id):
    """Get user session

    Args:
        user_id (str): user_id
        session_id (str): session_id

    Returns:
        session: dict
            "session_id": <session_id: string>,
            "session_name": <session_name: string>,
            "created_at": <start_time: datetime>,
            "ended_at": <end_time: datetime>,
            "blob": array of <blob: string>,
            "quiz": {
                "questions": array of <question: string>,
                "num_questions": <num_questions: int>,
            }
    """
    session = brain.get_session(user_id, session_id)
    return session

@app.post('/graph')
async def graph(content: Content):
    """Generate graph from a block a text

    The graph is stored as base 64 encoded bytes of the image. This is how it was created in Python, reverse it for JS:
        img_bytes = None
        with open("tmp/graph.jpg", "rb") as f:
            img_bytes = f.read()

        image = base64.b64encode(img_bytes).decode("utf-8")
        users_ref = firebase_db.collection(u'users')

    Args:
        content (Content): dict
            session_id: str
            user_id: str
            content: str | the text to generate the graph from
            reference_url: str | just a URL

    Returns:
        dict:
            status (str): The status of the operation. Will be ok
    """
    asyncio.create_task(brain.generate_graph(content.user_id, content.session_id, content.content, content.reference_url))
    return {"status": "ok"}

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

@app.post("/pdf-summarize")
async def pdf_summarize(pdfSession: PDFSession):
    """Generate Summary for a PDF

    Args:
        ytSession (PDFSession): dict
            user_id (str): The user id
            session_id (str): The session id
            url (str): The URL to the PDF

    Returns:
        dict:
            status (str): The status of the operation. Will be ok

    """
    asyncio.create_task(brain.summarize_pdf(pdfSession.user_id, pdfSession.session_id, pdfSession.url))
    return {"status": "ok"}

@app.get("/global-dashboard")
def global_dashboard(user_id):
    """Get dashboard data for a user

    Args:
        user_id (str): user_id

    Returns:
        dict:
            bar_graph (image): Activity of the last 7 sessions 
            pie_chart (image): Percentage of types of URLS in the recent submissions

            
    """
    dashboard = brain.global_dashboard(user_id)
    return dashboard