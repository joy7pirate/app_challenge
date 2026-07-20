import json

with open('data_backup_clean.json', encoding='utf-8') as f:
    data = json.load(f)

dossiers = [obj for obj in data if obj['model'] == 'medical.dossiermedical']
for obj in dossiers:
    pid = obj['fields'].get('patient')
    print("pk=" + repr(obj['pk']) + ", patient_id=" + repr(pid) + " type=" + str(type(pid)))