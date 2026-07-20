from pathlib import Path
from pypdf import PdfReader
from docx import Document

SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt"
}


def load_pdf(path):

    reader = PdfReader(path)

    text = ""

    for page in reader.pages:

        content = page.extract_text()

        if content:
            text += content + "\n"

    return text


def load_docx(path):

    document = Document(path)

    return "\n".join(
        paragraph.text
        for paragraph in document.paragraphs
    )


def load_txt(path):

    with open(
        path,
        "r",
        encoding="utf-8"
    ) as f:

        return f.read()


def load_documents(folder):

    folder = Path(folder)

    documents = []

    print("Recherche des documents...")

    for file in folder.rglob("*"):

        if file.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        print(f"Chargement : {file.name}")

        try:

            if file.suffix.lower() == ".pdf":
                documents.append(load_pdf(file))

            elif file.suffix.lower() == ".docx":
                documents.append(load_docx(file))

            elif file.suffix.lower() == ".txt":
                documents.append(load_txt(file))

        except Exception as e:

            print(f"Erreur {file.name} : {e}")

    print(f"{len(documents)} documents chargés.")

    return documents