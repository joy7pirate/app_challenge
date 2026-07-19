from sentence_transformers import SentenceTransformer

# Chargé une seule fois au démarrage
model = SentenceTransformer("BAAI/bge-small-en-v1.5")


def embed_text(text):
    """
    Retourne le vecteur d'un texte.
    """
    return model.encode(text).tolist()


def embed_documents(chunks):
    """
    Retourne une liste de vecteurs.
    """
    return model.encode(chunks).tolist()