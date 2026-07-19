def split_documents(documents, chunk_size=500, overlap=100):
    """
    Découpe une liste de documents en petits morceaux.
    """

    chunks = []

    for document in documents:

        start = 0

        while start < len(document):

            end = start + chunk_size

            chunk = document[start:end]

            if chunk.strip():
                chunks.append(chunk)

            start += chunk_size - overlap

    return chunks