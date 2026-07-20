from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Patient, DossierMedical

@receiver(post_save, sender=Patient)
def creer_dossier_medical(sender, instance, created, raw=False, **kwargs):
    if raw:
        return
    if created:
        DossierMedical.objects.get_or_create(patient=instance)