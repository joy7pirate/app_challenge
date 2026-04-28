from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import CentreSante, Medecin, Disponibilite
from .serializers import CentreSanteSerializer, MedecinSerializer, DisponibiliteSerializer
# Create your views here.
class CentreSanteListCreateView(ListCreateAPIView):
    queryset = CentreSante.objects.all()
    serializer_class = CentreSanteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ville']

class MedecinListCreateView(ListCreateAPIView):
    queryset = Medecin.objects.all()
    serializer_class = MedecinSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['specialite', 'centre']

class DisponibiliteListCreateView(ListCreateAPIView):
    queryset = Disponibilite.objects.all()
    serializer_class = DisponibiliteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['medecin', 'jour']