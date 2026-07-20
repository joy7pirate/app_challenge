from openai import OpenAI

from chatbot.services.prompts import SYSTEM_PROMPT


client = OpenAI(
    base_url="http://127.0.0.1:1234/v1",
    api_key="lm-studio"
)


def ask_llm(
    question,
    context="",
    history=None
):

    messages = [

        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }

    ]

    if history:

        messages.extend(history)

    messages.append(

        {
            "role": "user",
            "content": question
        }

    )

    response = client.chat.completions.create(

        model="qwen3-4b-instruct",

        messages=messages,

        temperature=0.2,

        max_tokens=600,

    )

    return response.choices[0].message.content