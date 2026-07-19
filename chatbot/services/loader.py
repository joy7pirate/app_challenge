from pathlib import Path
from pypdf import PdfReader
from docx import Document


def load_pdf(path):
    reader = PdfReader(path)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text


def load_docx(path):
    doc = Document(path)

    text = ""

    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"

    return text


def load_txt(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_documents(folder):

    documents = []

    folder = Path(folder)

    for file in folder.rglob("*"):

        if file.suffix.lower() == ".pdf":
            documents.append(load_pdf(file))

        elif file.suffix.lower() == ".docx":
            documents.append(load_docx(file))

        elif file.suffix.lower() == ".txt":
            documents.append(load_txt(file))

    return documents