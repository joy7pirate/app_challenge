from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio"
)
from .prompts import SYSTEM_PROMPT

def ask_llm(question, context=""):

    response = client.chat.completions.create(
       model="qwen/qwen3-4b-2507",
        messages=[
            {
                "role":"system",
                "content":SYSTEM_PROMPT
            },
            {
                "role":"user",
                "content":f"""
Contexte :

{context}

Question :

{question}
"""
            }
        ],
        temperature=0.3
    )

    return response.choices[0].message.content