from medical.models import Patient
from rendezvous.models import RendezVous
from consultation.models import Consultation


def get_patient_context(user):

    if not user.is_authenticated:
        return ""

    try:
        patient = Patient.objects.get(user=user)

    except Patient.DoesNotExist:
        return ""

    consultations = Consultation.objects.filter(
        patient=patient
    ).order_by("-date")[:5]

    rendezvous = RendezVous.objects.filter(
        patient=patient
    ).order_by("-date")[:5]

    context = []

    context.append(f"Nom : {patient.nom}")
    context.append(f"Prénom : {patient.prenom}")
    context.append(f"Sexe : {patient.sexe}")
    context.append(f"Âge : {patient.age}")

    context.append("")

    context.append("Dernières consultations :")

    for consultation in consultations:

        context.append(
            f"- {consultation.date} : {consultation.motif}"
        )

    context.append("")

    context.append("Derniers rendez-vous :")

    for rdv in rendezvous:

        context.append(
            f"- {rdv.date} : {rdv.statut}"
        )

    return "\n".join(context)