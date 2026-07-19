from openai import OpenAI
from .prompts import SYSTEM_PROMPT

# Client LM Studio
client = OpenAI(
    base_url="http://127.0.0.1:1234/v1",
    api_key="lm-studio"
)


def ask_llm(question: str, context: str = "") -> str:
    """
    Envoie une question au modèle Qwen exécuté dans LM Studio.
    """

    response = client.chat.completions.create(
        model="qwen3-4b-instruct",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": f"""
Contexte :
{context}

Question :
{question}
"""
            }
        ],
        temperature=0.3,
        max_tokens=512,
    )

    return response.choices[0].message.content