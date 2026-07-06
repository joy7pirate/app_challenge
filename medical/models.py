from django.db import models
from django.contrib.auth.models import User  # ← AJOUTER


class CentreSante(models.Model):
    nom = models.CharField(max_length=100)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20)
    email = models.EmailField()
    ville = models.CharField(max_length=100)

    def __str__(self):
        return self.nom


class Medecin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    specialite = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20)
    email = models.EmailField()
    centre = models.ForeignKey(CentreSante, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.prenom} {self.nom} - {self.specialite}"


class Disponibilite(models.Model):
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE)
    jour = models.CharField(max_length=20)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()

    def __str__(self):
        return f"{self.medecin} - {self.jour} {self.heure_debut}-{self.heure_fin}"


class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  
    telephone = models.CharField(max_length=20)                  
    date_naissance = models.DateField()                          
    adresse = models.CharField(max_length=255)                   

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"


class RendezVous(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirme', 'Confirmé'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)  
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE)  
    jour = models.DateField()                                        
    heure = models.TimeField()                                       
    motif = models.TextField()                                       
    statut = models.CharField(                                       
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='en_attente'
    )

    def __str__(self):
        return f"RDV {self.patient} - Dr {self.medecin} le {self.jour}"

class DossierMedical(models.Model):
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='dossiermedical')
    groupe_sanguin = models.CharField(max_length=10, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    antecedents = models.TextField(blank=True, null=True)
    maladies_chroniques = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dossier médical de {self.patient}"


class Consultation(models.Model):
    dossier_medical = models.ForeignKey(DossierMedical, on_delete=models.CASCADE, related_name='consultations')
    rdv = models.OneToOneField(RendezVous, on_delete=models.CASCADE, related_name='consultation', null=True, blank=True)
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE, related_name='consultations')
    date = models.DateTimeField(auto_now_add=True)
    motif = models.TextField()
    diagnostic = models.TextField(blank=True, null=True)
    traitement = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_verrouille = models.BooleanField(default=False)

    def __str__(self):
        return f"Consultation du {self.date}"


class Ordonnance(models.Model):
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name='ordonnance')
    medicaments = models.TextField()
    duree = models.CharField(max_length=100, blank=True, null=True)
    instructions = models.TextField(blank=True, null=True)
    date_emission = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ordonnance de {self.consultation}"


class Examen(models.Model):
    TYPE_EXAMEN_CHOICES = [
        ('analyse', 'Analyse'),
        ('radio', 'Radio'),
        ('echo', 'Échographie'),
        ('irm', 'IRM'),
        ('autre', 'Autre'),
    ]
    dossier_medical = models.ForeignKey(DossierMedical, on_delete=models.CASCADE, related_name='examens')
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='examens', null=True, blank=True)
    type_examen = models.CharField(max_length=20, choices=TYPE_EXAMEN_CHOICES)
    description = models.TextField(blank=True, null=True)
    resultat = models.TextField(blank=True, null=True)
    fichier = models.FileField(upload_to='examens/', blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type_examen} - {self.dossier_medical}"