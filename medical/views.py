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
from medical import serializers

from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]  # ← obligatoire

    def get_queryset(self):
        return RendezVous.objects.filter(patient=self.request.user.patient)

    def perform_create(self, serializer):
        try:
            patient = self.request.user.patient
            serializer.save(patient=patient)
        except Exception as e:
            raise serializers.ValidationError(f"Erreur patient : {e}")

# Modifier / Annuler un RDV
class RendezVousDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RendezVousSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

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




@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        User = get_user_model()
        user_obj = User.objects.get(email=email)
        user = authenticate(username=user_obj.username, password=password)
    except User.DoesNotExist:
        return Response({'error': 'Email introuvable'}, status=400)

    if user is None:
        return Response({'error': 'Mot de passe incorrect'}, status=400)

    # ─── Déterminer le rôle ───────────────────────────
    if hasattr(user, 'medecin'):
        role = 'medecin'
    elif hasattr(user, 'patient'):
        role = 'patient'
    else:
        role = 'admin'
    # ─────────────────────────────────────────────────

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'role': role,  # ← NOUVEAU
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    })


class MedecinDashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Vérifier que c'est bien un médecin
        if not hasattr(request.user, 'medecin'):
            return Response(
                {'error': 'Accès refusé'},
                status=status.HTTP_403_FORBIDDEN
            )

        medecin = request.user.medecin

        # Ses rendez-vous
        rendezvous = RendezVous.objects.filter(medecin=medecin)
        rdv_serializer = RendezVousSerializer(rendezvous, many=True)

        # Ses disponibilités
        dispos = Disponibilite.objects.filter(medecin=medecin)
        dispo_serializer = DisponibiliteSerializer(dispos, many=True)

        return Response({
            'medecin': MedecinSerializer(medecin).data,
            'rendezvous': rdv_serializer.data,
            'disponibilites': dispo_serializer.data,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    if hasattr(user, 'medecin'):
        role = 'medecin'
        extra = {'medecin_id': user.medecin.id,
                 'first_name': user.medecin.nom,
                 'last_name': user.medecin.prenom,
                 'specialite': user.medecin.specialite}
    elif hasattr(user, 'patient'):
        role = 'patient'
        extra = {'patient_id': user.patient.id,
                #  'first_name': user.patient.nom, 'last_name': user.patient.prenom
                }
    else:
        role = 'admin'
        extra = {}

    return Response({
        'role': role,
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'first_name': user.first_name,
        **extra
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def changer_statut_rdv(request, rdv_id):
    if not hasattr(request.user, 'medecin'):
        return Response({'error': 'Accès refusé'}, status=403)

    try:
        rdv = RendezVous.objects.get(id=rdv_id, medecin=request.user.medecin)
    except RendezVous.DoesNotExist:
        return Response({'error': 'RDV introuvable'}, status=404)

    rdv.statut = request.data.get('statut', rdv.statut)
    rdv.save()
    return Response({'message': 'Statut mis à jour', 'statut': rdv.statut})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rdv_medecin(request):
    rdvs = RendezVous.objects.filter(medecin=request.user.medecin)
    serializer = RendezVousSerializer(rdvs, many=True)
    return Response(serializer.data)