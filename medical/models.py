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
