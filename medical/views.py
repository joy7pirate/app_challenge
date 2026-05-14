from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
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

#  ca sert a afficher les disponibilites d'un medecin ou d'un centre de sante

class DisponibiliteListCreateView(ListCreateAPIView):
    queryset = Disponibilite.objects.all()
    serializer_class = DisponibiliteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['medecin', 'jour']


class CentreSanteDetailView(RetrieveUpdateDestroyAPIView):
    queryset = CentreSante.objects.all()
    serializer_class = CentreSanteSerializer


class MedecinDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Medecin.objects.all()
    serializer_class = MedecinSerializer


class DisponibiliteDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Disponibilite.objects.all()
    serializer_class = DisponibiliteSerializer