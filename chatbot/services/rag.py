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

    ####################################################
    # 1. Vérification urgence
    ####################################################

    if is_emergency(question):
        return EMERGENCY_MESSAGE

    ####################################################
    # 2. Détection du type de question
    ####################################################

    intent = detect_intent(question)

    ####################################################
    # 3. Recherche documentaire
    ####################################################

    pdf_context = ""

    if intent == "general":

        documents = vectorstore.search(
            question,
            top_k=5
        )

        pdf_context = "\n\n".join(documents)

    ####################################################
    # 4. Recherche dans les données du patient
    ####################################################

    patient_context = safe_context.build(
        user=user,
        intent=intent
    )

    ####################################################
    # 5. Construction du prompt
    ####################################################

    prompt = build_prompt(
        question=question,
        pdf_context=pdf_context,
        patient_context=patient_context
    )

    ####################################################
    # 6. Historique
    ####################################################

    if user.is_authenticated:
        history_id = user.id
    else:
        history_id = "anonymous"

    history = conversation_manager.get_history(
        history_id
    )

    ####################################################
    # 7. Appel du LLM
    ####################################################

    answer = ask_llm(
        question=prompt,
        context="",
        history=history
    )

    ####################################################
    # 8. Sauvegarde mémoire
    ####################################################

    conversation_manager.add_message(
        history_id,
        "user",
        question
    )

    conversation_manager.add_message(
        history_id,
        "assistant",
        answer
    )

    return answer