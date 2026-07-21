from chatbot.services.vectorstore import VectorStore
from chatbot.services.llm import ask_llm
from chatbot.services.prompt_builder import build_prompt
from chatbot.services.question_router import detect_intent
from chatbot.services.safe_context import SafeContext
from chatbot.services.conversation_manager import conversation_manager
from chatbot.services.emergency import (
    is_emergency,
    EMERGENCY_MESSAGE,
)

vectorstore = VectorStore()

if vectorstore.exists():
    vectorstore.load()
else:
    vectorstore.build()

safe_context = SafeContext()


def ask_rag(user, question):

    if is_emergency(question):
        return EMERGENCY_MESSAGE

    intent = detect_intent(question)

    # #### 1. Intent detection
    print("=== INTENT ===", intent)

    pdf_context = ""

    if intent == "general":
        # #### 2. Retrieval
        documents = vectorstore.search(question, top_k=5)

        print("=== DOCUMENTS TROUVÉS ===", len(documents))
        for i, d in enumerate(documents):
            print(f"--- doc {i} ---")
            print(d[:300])

        pdf_context = "\n\n".join(documents)

    patient_context = safe_context.build(user=user, intent=intent)

    # #### 3. Prompt construction
    prompt = build_prompt(
        question=question,
        pdf_context=pdf_context,
        patient_context=patient_context
    )

    # #### 4. PDF context verification
    print("=== PDF CONTEXT FINAL ===")
    print(pdf_context[:1000] if pdf_context else "(VIDE)")

    if user.is_authenticated:
        history_id = user.id
    else:
        history_id = "anonymous"

    history = conversation_manager.get_history(history_id)

    # #### 5. LLM call
    print("=== PROMPT ENVOYÉ AU LLM ===")
    print(prompt)

    answer = ask_llm(
        question=prompt,
        context="",
        history=history
    )

    conversation_manager.add_message(history_id, "user", question)
    conversation_manager.add_message(history_id, "assistant", answer)

    return answer