from tenacity import (
    retry,
    stop_after_attempt,
    wait_random_exponential,
)  
import openai
import os
import cohere
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_KEY")
COHERE_API_KEY = os.environ.get("COHERE_KEY")
openai.api_key = OPENAI_API_KEY

cohere_client = cohere.Client(COHERE_API_KEY)

with open('backend/prompts/feedback_system.txt', 'r') as f:
    feedback_system = f.read()

with open('backend/prompts/feedback_user.txt', 'r') as f:
    feedback_user = f.read()

with open('backend/prompts/summarize_system.txt', 'r') as f:
    summarize_system = f.read()
    