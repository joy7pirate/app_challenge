import json

with open('data_backup_clean.json', encoding='utf-8') as f:
    data = json.load(f)

# Compter tous les modèles présents
from collections import Counter
models = Counter(obj['model'] for obj in data)
for model, count in models.items():
    print(model, count)

print("---")

# Chercher TOUTES les occurrences liées à dossiermedical, patient=6, peu importe la casse
for obj in data:
    if 'dossier' in obj['model'].lower():
        print(obj)