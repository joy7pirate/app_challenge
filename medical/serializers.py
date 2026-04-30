from rest_framework import serializers
from .models import CentreSante, Medecin, Disponibilite

class DisponibiliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disponibilite
        fields = '__all__'

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

class MedecinSerializer(serializers.ModelSerializer):
    centre_detail = CentreSanteSerializer(source='centre', read_only=True)

    disponibilites = DisponibiliteSerializer(
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