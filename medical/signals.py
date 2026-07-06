from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Patient, DossierMedical


@receiver(post_save, sender=Patient)
def create_patient_dossier(sender, instance, created, **kwargs):
    """Créer automatiquement un dossier médical vide lorsqu'un patient est créé."""
    if created:
        DossierMedical.objects.get_or_create(patient=instance)
