from backend import feedback_system, feedback_user, summarize_system
import openai

def feedback(question, reference_answer, chosen_answer, context, references=None):
    system_query = feedback_system.format()
    user_query = feedback_user.format(question=question, reference_answer=reference_answer, chosen_answer=chosen_answer, context=context)
    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
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

def summarize(text):
    summary = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[
            {"role": "system", "content": summarize_system},
            {"role": "user", "content": text},
        ],
        temperature=1.2,
        top_p=1,
        timeout=10,
    )
    summary = summary['choices'][0]['message']['content'][9:]
    return {
        "summarized_text": summary
    }