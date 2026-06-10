from django.shortcuts import render, get_object_or_404
from rest_framework import generics, permissions, viewsets, status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import CentreSante, Medecin, Disponibilite, Patient, RendezVous
from .serializers import (CentreSanteSerializer, MedecinSerializer,
                          DisponibiliteSerializer, PatientSerializer,
                          RendezVousSerializer, RegisterSerializer)

# Create your views here.
# Les vues pour les centres de santé, les médecins et les disponibilités sont créées en utilisant des classes génériques de DRF pour faciliter les opérations CRUD.
class CentreSanteListCreateView(ListCreateAPIView):
    queryset = CentreSante.objects.all()
    serializer_class = CentreSanteSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ville']

class MedecinListCreateView(ListCreateAPIView):
    queryset = Medecin.objects.all()
    serializer_class = MedecinSerializer
    permission_classes = [AllowAny]  # ← ajoute
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['specialite', 'centre']
#  ca sert a afficher les disponibilites d'un medecin ou d'un centre de sante

class DisponibiliteListCreateView(ListCreateAPIView):
    queryset = Disponibilite.objects.all()
    serializer_class = DisponibiliteSerializer
    permission_classes = [AllowAny]  # ← ajoute
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['medecin', 'jour']


class CentreSanteDetailView(RetrieveUpdateDestroyAPIView):
    queryset = CentreSante.objects.all()
    serializer_class = CentreSanteSerializer


class MedecinDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Medecin.objects.all()
    serializer_class = MedecinSerializer
    permission_classes = [AllowAny]



class DisponibiliteDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Disponibilite.objects.all()
    serializer_class = DisponibiliteSerializer


class PatientViewSet(viewsets.ViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        patient = get_object_or_404(Patient, user=request.user)
        serializer = PatientSerializer(patient)
        return Response(serializer.data)

# Voir mes RDV + Créer un RDV
class RendezVousListCreateView(generics.ListCreateAPIView):
    serializer_class = RendezVousSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return RendezVous.objects.filter(patient=self.request.user.patient)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user.patient)

# Modifier / Annuler un RDV
class RendezVousDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RendezVousSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return RendezVous.objects.filter(patient=self.request.user.patient)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Compte créé !"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)