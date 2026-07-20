CHUNK_SIZE = 700

CHUNK_OVERLAP = 150


def split_documents(
    documents,
    chunk_size=CHUNK_SIZE,
    overlap=CHUNK_OVERLAP
):

    chunks = []

    for document in documents:

        start = 0

        while start < len(document):

            end = start + chunk_size

            chunk = document[start:end]

            if chunk.strip():

                chunks.append(chunk)

            start += chunk_size - overlap

    print(f"{len(chunks)} morceaux créés.")

    return chunks