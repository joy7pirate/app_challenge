from sentence_transformers import SentenceTransformer

MODEL_NAME = "BAAI/bge-small-en-v1.5"

print(f"Chargement du modèle d'embeddings : {MODEL_NAME}")

model = SentenceTransformer(MODEL_NAME)


def embed_text(text: str):
    """
    Retourne l'embedding d'un texte.
    """
    return model.encode(
        text,
        normalize_embeddings=True
    ).tolist()


def embed_documents(documents: list[str]):
    """
    Retourne les embeddings d'une liste de documents.
    """
    return model.encode(
        documents,
        normalize_embeddings=True
    ).tolist()