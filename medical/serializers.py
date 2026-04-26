from rest_framework import serializers
from .models import CentreSante, Medecin, Disponibilite

class CentreSanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CentreSante
        fields = '__all__'

class MedecinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medecin
        fields = '__all__'

class DisponibiliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disponibilite
        fields = '__all__'