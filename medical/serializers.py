from rest_framework import serializers
from .models import CentreSante, Medecin, Disponibilite

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