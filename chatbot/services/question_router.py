import re


INTENTS = {
    "appointment": [
        r"\brendez[- ]?vous\b",
        r"\brdv\b",
        r"\bprochain rendez[- ]?vous\b",
    ],

    "consultation": [
        r"\bconsultation\b",
        r"\bdiagnostic\b",
    ],

    "prescription": [
        r"\bordonnance\b",
        r"\bmédicament\b",
        r"\bmedicament\b",
        r"\btraitement\b",
    ],

    "analysis": [
        r"\banalyse\b",
        r"\bexamen\b",
        r"\brésultat\b",
        r"\bresultat\b",
    ],

    "medical_record": [
        r"\ballergie\b",
        r"\bgroupe sanguin\b",
        r"\bantécédent\b",
        r"\bantecedent\b",
    ]
}


def detect_intent(question):

    question = question.lower()

    for intent, patterns in INTENTS.items():

        for pattern in patterns:

            if re.search(pattern, question):

                return intent

    return "general"