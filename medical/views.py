from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView
from .models import CentreSante, Medecin, Disponibilite
from .serializers import CentreSanteSerializer, MedecinSerializer, DisponibiliteSerializer
# Create your views here.
class CentreSanteListCreateView(ListCreateAPIView):
    queryset = CentreSante.objects.all()
    serializer_class = CentreSanteSerializer

class MedecinListCreateView(ListCreateAPIView):
    queryset = Medecin.objects.all()
    serializer_class = MedecinSerializer

class DisponibiliteListCreateView(ListCreateAPIView):
    queryset = Disponibilite.objects.all()
    serializer_class = DisponibiliteSerializer