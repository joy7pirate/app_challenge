import re

EMERGENCY_PATTERNS = [

    r"\b(crise cardiaque)\b",
    r"\b(infarctus)\b",
    r"\b(avc)\b",
    r"\b(accident vasculaire)\b",
    r"\b(hémorragie)\b",
    r"\b(hemorragie)\b",
    r"\b(difficulté à respirer)\b",
    r"\b(ne respire plus)\b",
    r"\b(perte de connaissance)\b",
    r"\b(inconscient)\b",
    r"\b(convulsion)\b",
    r"\b(saignement abondant)\b",
    r"\b(tentative de suicide)\b",
    r"\b(suicide)\b",
]


EMERGENCY_MESSAGE = """
🚨 Cette situation peut constituer une urgence médicale.

Je ne peux pas poser de diagnostic.

Veuillez contacter immédiatement les services d'urgence ou vous rendre au centre de santé le plus proche.

Si la personne est inconsciente ou ne respire plus, appelez immédiatement les secours.
"""


def is_emergency(message: str):

    message = message.lower()

    for pattern in EMERGENCY_PATTERNS:

        if re.search(pattern, message):
            return True

    return False