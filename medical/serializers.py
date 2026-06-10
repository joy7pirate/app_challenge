from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CentreSante, Medecin, Disponibilite, Patient, RendezVous


class DisponibiliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disponibilite
        fields = '__all__'

    def validate(self, data):
        if data['heure_fin'] <= data['heure_debut']:
            raise serializers.ValidationError(
                "L'heure de fin doit être supérieure à l'heure de début."
            )
        return data

class MedecinSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour éviter la récursion dans CentreSanteSerializer"""
    class Meta:
        model = Medecin
        fields = [
            'id',
            'nom',
            'prenom',
            'specialite',
        ]

class CentreSanteSerializer(serializers.ModelSerializer):
    medecins = MedecinSimpleSerializer(source='medecin_set', many=True, read_only=True)

    class Meta:
        model = CentreSante
        fields = [
            'id',
            'nom',
            'adresse',
            'telephone',
            'email',
            'ville',
            'medecins',
        ]

class CentreSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CentreSante
        fields = ['id', 'nom', 'ville', 'adresse', 'telephone']

class DisponibiliteSimpleSerializer(serializers.ModelSerializer):


    class Meta:
        model = Disponibilite
        fields = ['id', 'jour', 'heure_debut', 'heure_fin']



class MedecinSerializer(serializers.ModelSerializer):
    centre_detail = CentreSimpleSerializer(source='centre', read_only=True)

    disponibilites = DisponibiliteSimpleSerializer(
        source='disponibilite_set',
        many=True,
        read_only=True
    )

    class Meta:
        model = Medecin
        fields = [
            'id',
            'nom',
            'prenom',
            'specialite',
            'telephone',
            'email',
            'centre',
            'centre_detail',
            'disponibilites',
        ]       # fields = '__all__'




class RegisterSerializer(serializers.ModelSerializer):
    telephone      = serializers.CharField()
    date_naissance = serializers.DateField()
    adresse        = serializers.CharField()
    password       = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'email', 'password',
                  'telephone', 'date_naissance', 'adresse']

    def create(self, validated_data):
        # Séparer les données Patient
        telephone      = validated_data.pop('telephone')
        date_naissance = validated_data.pop('date_naissance')
        adresse        = validated_data.pop('adresse')

        # Créer le User
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )

        # Créer le Patient lié
        Patient.objects.create(
            user=user,
            telephone=telephone,
            date_naissance=date_naissance,
            adresse=adresse,
        )

        return user


# ─── PATIENT ─────────────────────────────────────────

class PatientSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name  = serializers.CharField(source='user.last_name',  read_only=True)
    email      = serializers.EmailField(source='user.email',     read_only=True)

    class Meta:
        model  = Patient
        fields = ['id', 'first_name', 'last_name', 'email',
                  'telephone', 'date_naissance', 'adresse']


# ─── RENDEZ-VOUS ─────────────────────────────────────

class RendezVousSerializer(serializers.ModelSerializer):
    patient_detail = PatientSerializer(source='patient', read_only=True)
    medecin_detail = MedecinSimpleSerializer(source='medecin', read_only=True)

    class Meta:
        model  = RendezVous
        fields = ['id', 'patient', 'medecin', 'jour', 'heure',
                  'motif', 'statut', 'patient_detail', 'medecin_detail']
        read_only_fields = ['patient','statut']  # le patient = user connecté automatiquement