def build_prompt(question, pdf_context="", patient_context=""):

    return f"""
Tu es MedaClick AI.

Tu réponds uniquement à partir du contexte fourni.

Si une information n'est pas présente,
tu réponds que tu ne la connais pas.

==============================
Contexte documentaire
==============================

{pdf_context}

==============================
Informations du patient
==============================

{patient_context}

==============================
Question
==============================

{question}
"""