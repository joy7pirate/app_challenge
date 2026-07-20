from pathlib import Path
import pickle
import faiss
import numpy as np

from chatbot.services.loader import load_documents
from chatbot.services.splitter import split_documents
from chatbot.services.embeddings import (
    embed_documents,
    embed_text
)

VECTORSTORE_PATH = Path("chatbot/vectorstore")

INDEX_PATH = VECTORSTORE_PATH / "index.faiss"

METADATA_PATH = VECTORSTORE_PATH / "metadata.pkl"


class VectorStore:

    def __init__(self):

        VECTORSTORE_PATH.mkdir(
            parents=True,
            exist_ok=True
        )

        self.index = None
        self.chunks = []

    def exists(self):

        return (
            INDEX_PATH.exists()
            and
            METADATA_PATH.exists()
        )

    def build(self):

        print("=" * 50)
        print("Construction du VectorStore")
        print("=" * 50)

        documents = load_documents(
            "medical_documents"
        )

        self.chunks = split_documents(documents)

        print("Création des embeddings...")

        embeddings = embed_documents(self.chunks)

        vectors = np.array(
            embeddings,
            dtype=np.float32
        )

        dimension = vectors.shape[1]

        self.index = faiss.IndexFlatIP(
            dimension
        )

        self.index.add(vectors)

        faiss.write_index(
            self.index,
            str(INDEX_PATH)
        )

        with open(
            METADATA_PATH,
            "wb"
        ) as file:

            pickle.dump(
                self.chunks,
                file
            )

        print()

        print("VectorStore créé.")

        print(f"Documents : {len(documents)}")

        print(f"Chunks : {len(self.chunks)}")

        print(f"Dimension : {dimension}")

        print("=" * 50)

    def load(self):

        print("Chargement du VectorStore...")

        self.index = faiss.read_index(
            str(INDEX_PATH)
        )

        with open(
            METADATA_PATH,
            "rb"
        ) as file:

            self.chunks = pickle.load(file)

        print("VectorStore chargé.")

    def search(
        self,
        question,
        top_k=3
    ):

        embedding = embed_text(question)

        embedding = np.array(
            [embedding],
            dtype=np.float32
        )

        distances, indices = self.index.search(
            embedding,
            top_k
        )

        results = []

        for index in indices[0]:

            if index == -1:
                continue

            results.append(
                self.chunks[index]
            )

        return results