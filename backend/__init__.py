from dotenv import load_dotenv
load_dotenv()
import openai
import os
import cohere
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import matplotlib
matplotlib.use('Agg')

cred = credentials.Certificate("firebase_config.json")

firebase_app = firebase_admin.initialize_app(cred)
firebase_db = firestore.client()

OPENAI_API_KEY = os.environ.get("OPENAI_KEY")
COHERE_API_KEY = os.environ.get("COHERE_KEY")
openai.api_key = OPENAI_API_KEY

cohere_client = cohere.Client(COHERE_API_KEY)
YOUTUBE_BLOB_SIZE = 150
LLM_MODEL = os.environ.get("LLM_MODEL", "COHERE")
class FormatError(Exception):
    pass

with open('backend/prompts/feedback_system.txt', 'r') as f:
    feedback_system = f.read()

with open('backend/prompts/feedback_user.txt', 'r') as f:
    feedback_user = f.read()

with open('backend/prompts/summarize_system.txt', 'r') as f:
    summarize_system = f.read()

with open('backend/prompts/questions_system.txt', 'r') as f:
    questions_system = f.read()

with open('backend/prompts/graph_system.txt', 'r') as f:
    graph_system = f.read()
