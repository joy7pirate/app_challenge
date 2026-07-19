from chatbot.services.loader import load_documents
from chatbot.services.splitter import split_documents
from chatbot.services.embeddings import embed_documents, embed_text
from chatbot.services.llm import ask_llm

from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# Chargement des documents
documents = load_documents("medical_documents")

# Découpage
chunks = split_documents(documents)

# Création des embeddings
chunk_embeddings = embed_documents(chunks)


def search(query, top_k=3):
    """
    Recherche les morceaux les plus pertinents.
    """

    query_embedding = embed_text(query)

    similarities = cosine_similarity(
        [query_embedding],
        chunk_embeddings
    )[0]

    best_indices = np.argsort(similarities)[::-1][:top_k]

    return [chunks[i] for i in best_indices]


def ask_rag(question):
    """
    Pose une question au RAG.
    """

    context = "\n\n".join(search(question))

    prompt = f"""
Tu es MedaClick AI.

Réponds uniquement à partir du contexte suivant.

Contexte :

{context}

Question :

{question}
"""

    return ask_llm(prompt)