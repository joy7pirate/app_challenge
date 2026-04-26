from django.db import models

# Create your models here.
class Medecin(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    specialite = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20)
    email = models.EmailField()
    centre = models.ForeignKey('CentreSante', on_delete=models.CASCADE)
    def __str__(self):
        return f"{self.prenom} {self.nom} - {self.specialite}"


class CentreSante(models.Model):
    nom = models.CharField(max_length=100)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20)
    email = models.EmailField()
    ville = models.CharField(max_length=100)
    def __str__(self):
        return self.nom


class Disponibilite(models.Model):
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE)
    # centre_sante = models.ForeignKey(centre_sante, on_delete=models.CASCADE)
    jour = models.CharField(max_length=20)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    def __str__(self):
        return f"{self.medecin}  - {self.jour} {self.heure_debut}-{self.heure_fin}"