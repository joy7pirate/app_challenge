from django.utils import timezone

from medical.models import (
    Patient,
    RendezVous,
    DossierMedical,
    Consultation,
    Ordonnance,
    Examen,
)


class SafeContext:

    def build(self, user, intent):

        if not user.is_authenticated:
            return ""

        try:
            patient = Patient.objects.get(user=user)

        except Patient.DoesNotExist:
            return "Aucun patient associé à cet utilisateur."

        handlers = {
            "appointment": self._appointment,
            "consultation": self._consultation,
            "prescription": self._prescription,
            "analysis": self._analysis,
            "medical_record": self._medical_record,
        }

        handler = handlers.get(intent)

        if handler is None:
            return ""

        return handler(patient)

    #####################################################################
    # RENDEZ-VOUS
    #####################################################################

    def _appointment(self, patient):

        rdv = (
            RendezVous.objects
            .filter(
                patient=patient,
                jour__gte=timezone.now().date()
            )
            .exclude(statut="annule")
            .order_by("jour", "heure")
            .first()
        )

        if rdv is None:
            return "Le patient ne possède aucun rendez-vous à venir."

        return f"""
PATIENT

Nom :
{patient.user.get_full_name()}

PROCHAIN RENDEZ-VOUS

Date : {rdv.jour}

Heure : {rdv.heure}

Médecin :
Dr {rdv.medecin.prenom} {rdv.medecin.nom}

Spécialité :
{rdv.medecin.specialite}

Statut :
{rdv.statut}

Motif :
{rdv.motif}
"""

    #####################################################################
    # CONSULTATION
    #####################################################################

    def _consultation(self, patient):

        dossier = getattr(patient, "dossiermedical", None)

        if dossier is None:
            return "Le patient ne possède pas de dossier médical."

        consultation = (
            Consultation.objects
            .filter(
                dossier_medical=dossier
            )
            .order_by("-date")
            .first()
        )

        if consultation is None:
            return "Aucune consultation trouvée."

        return f"""
DERNIÈRE CONSULTATION

Date :
{consultation.date}

Médecin :
Dr {consultation.medecin.prenom}
{consultation.medecin.nom}

Motif :
{consultation.motif}

Diagnostic :
{consultation.diagnostic}

Traitement :
{consultation.traitement}

Notes :
{consultation.notes}
"""

    #####################################################################
    # ORDONNANCE
    #####################################################################

    def _prescription(self, patient):

        dossier = getattr(patient, "dossiermedical", None)

        if dossier is None:
            return "Aucun dossier médical."

        consultation = (
            Consultation.objects
            .filter(
                dossier_medical=dossier
            )
            .order_by("-date")
            .first()
        )

        if consultation is None:
            return "Aucune consultation."

        try:

            ordonnance = consultation.ordonnance

        except Ordonnance.DoesNotExist:

            return "Aucune ordonnance disponible."

        return f"""
ORDONNANCE

Date :
{ordonnance.date_emission}

Médicaments :

{ordonnance.medicaments}

Durée :

{ordonnance.duree}

Instructions :

{ordonnance.instructions}
"""

    #####################################################################
    # EXAMENS
    #####################################################################

    def _analysis(self, patient):

        dossier = getattr(patient, "dossiermedical", None)

        if dossier is None:
            return "Aucun dossier médical."

        examens = (
            Examen.objects
            .filter(
                dossier_medical=dossier
            )
            .order_by("-date")[:5]
        )

        if not examens.exists():
            return "Aucun examen enregistré."

        texte = "DERNIERS EXAMENS\n\n"

        for examen in examens:

            texte += f"""
Type :
{examen.type_examen}

Date :
{examen.date}

Description :
{examen.description}

Résultat :
{examen.resultat}

----------------------------------
"""

        return texte

    #####################################################################
    # DOSSIER MÉDICAL
    #####################################################################

    def _medical_record(self, patient):

        dossier = getattr(patient, "dossiermedical", None)

        if dossier is None:
            return "Aucun dossier médical."

        return f"""
DOSSIER MÉDICAL

Groupe sanguin :

{dossier.groupe_sanguin}

Allergies :

{dossier.allergies}

Antécédents :

{dossier.antecedents}

Maladies chroniques :

{dossier.maladies_chroniques}
"""