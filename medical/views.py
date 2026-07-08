from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets, status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate, get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

from .models import (
    CentreSante,
    Medecin,
    Disponibilite,
    Patient,
    RendezVous,
    DossierMedical,
    Consultation,
    Ordonnance,
    Examen,
)
from .serializers import (
    CentreSanteSerializer,
    MedecinSerializer,
    DisponibiliteSerializer,
    PatientSerializer,
    RendezVousSerializer,
    RendezVousPatientSerializer,
    RegisterSerializer,
    DossierMedicalSerializer,
    ConsultationSerializer,
    OrdonnanceSerializer,
    ExamenSerializer,
)
from medical import serializers


class IsRendezVousConfirme(BasePermission):
    """Vérifie qu’un rendez-vous est confirmé ou terminé avant une action médicale."""

    def has_object_permission(self, request, view, obj):
        return getattr(obj, 'statut', None) in ['confirme', 'termine']


class IsNotVerrouille(BasePermission):
    """Bloque toute modification d’un objet déjà verrouillé."""

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'is_verrouille'):
            return not obj.is_verrouille
        consultation = getattr(obj, 'consultation', None)
        return not getattr(consultation, 'is_verrouille', False)


def _has_confirmed_or_finished_rdv(medecin, patient):
    return RendezVous.objects.filter(
        medecin=medecin,
        patient=patient,
        statut__in=['confirme', 'termine', 'accepte'],
    ).exists()


class CentreSanteListCreateView(ListCreateAPIView):
    queryset = CentreSante.objects.all()
    serializer_class = CentreSanteSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ville']


class MedecinListCreateView(ListCreateAPIView):
    queryset = Medecin.objects.all()
    serializer_class = MedecinSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['specialite', 'centre']


class DisponibiliteListCreateView(ListCreateAPIView):
    queryset = Disponibilite.objects.all()
    serializer_class = DisponibiliteSerializer
    permission_classes = [AllowAny]
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

    def partial_update(self, request, pk=None):
        patient = get_object_or_404(Patient, pk=pk, user=request.user)
        serializer = PatientSerializer(patient, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class RendezVousListCreateView(generics.ListCreateAPIView):
    serializer_class = RendezVousSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RendezVous.objects.filter(patient=self.request.user.patient)

    def perform_create(self, serializer):
        try:
            patient = self.request.user.patient
            serializer.save(patient=patient)
        except Exception as e:
            raise serializers.ValidationError(f"Erreur patient : {e}")


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
        user_model = get_user_model()
        user_obj = user_model.objects.get(email=email)
        user = authenticate(username=user_obj.username, password=password)
    except user_model.DoesNotExist:
        return Response({'error': 'Email introuvable'}, status=400)

    if user is None:
        return Response({'error': 'Mot de passe incorrect'}, status=400)

    if hasattr(user, 'medecin'):
        role = 'medecin'
    elif hasattr(user, 'patient'):
        role = 'patient'
    else:
        role = 'admin'

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'role': role,
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
        if not hasattr(request.user, 'medecin'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        medecin = request.user.medecin
        rendezvous = RendezVous.objects.filter(medecin=medecin)
        dispos = Disponibilite.objects.filter(medecin=medecin)

        return Response({
            'medecin': MedecinSerializer(medecin).data,
            'rendezvous': RendezVousSerializer(rendezvous, many=True).data,
            'disponibilites': DisponibiliteSerializer(dispos, many=True).data,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    if hasattr(user, 'medecin'):
        role = 'medecin'
        extra = {
            'medecin_id': user.medecin.id,
            'first_name': user.medecin.nom,
            'last_name': user.medecin.prenom,
            'specialite': user.medecin.specialite,
        }
    elif hasattr(user, 'patient'):
        role = 'patient'
        extra = {'patient_id': user.patient.id}
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

    nouveau_statut = request.data.get('statut', rdv.statut)
    if nouveau_statut == 'accepte':
        nouveau_statut = 'confirme'

    rdv.statut = nouveau_statut

    # Gestion de la contre-proposition (report)
    if nouveau_statut == 'reporte':
        rdv.nouveau_jour = request.data.get('nouveau_jour', rdv.nouveau_jour)
        rdv.nouvelle_heure = request.data.get('nouvelle_heure', rdv.nouvelle_heure)
        rdv.commentaire_medecin = request.data.get('commentaire_medecin', rdv.commentaire_medecin)

    rdv.save()

    if rdv.statut == 'termine':
        consultation = Consultation.objects.filter(rdv=rdv).first()
        if consultation:
            consultation.is_verrouille = True
            consultation.save(update_fields=['is_verrouille'])

    return Response({'message': 'Statut mis à jour', 'statut': rdv.statut})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rdv_medecin(request):
    rdvs = RendezVous.objects.filter(medecin=request.user.medecin)
    serializer = RendezVousSerializer(rdvs, many=True)
    return Response(serializer.data)


class DossierPatientView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'patient'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        dossier = get_object_or_404(DossierMedical, patient=request.user.patient)
        serializer = DossierMedicalSerializer(dossier)
        return Response(serializer.data)


class MedecinPatientDossierView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_accessible_dossier(self, request, patient_id):
        if not hasattr(request.user, 'medecin'):
            return None, Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        patient = get_object_or_404(Patient, id=patient_id)
        if not _has_confirmed_or_finished_rdv(request.user.medecin, patient):
            return None, Response({'error': 'Accès refusé : aucun rendez-vous confirmé ou terminé ne relie ce médecin à ce patient.'}, status=status.HTTP_403_FORBIDDEN)

        dossier = get_object_or_404(DossierMedical, patient=patient)
        return dossier, None

    def get(self, request, patient_id):
        dossier, error_response = self._get_accessible_dossier(request, patient_id)
        if error_response is not None:
            return error_response

        serializer = DossierMedicalSerializer(dossier)
        return Response(serializer.data)

    def patch(self, request, patient_id):
        dossier, error_response = self._get_accessible_dossier(request, patient_id)
        if error_response is not None:
            return error_response

        serializer = DossierMedicalSerializer(dossier, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  


class ConsultationCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'medecin'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        rdv_id = request.data.get('rdv')
        if not rdv_id:
            return Response({'error': 'Le rendez-vous est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)

        rdv = get_object_or_404(RendezVous, id=rdv_id)
        if rdv.medecin != request.user.medecin:
            return Response({'error': 'Ce rendez-vous ne vous appartient pas.'}, status=status.HTTP_403_FORBIDDEN)
        if rdv.statut != 'confirme':
            return Response({'error': 'Une consultation ne peut être créée que pour un rendez-vous confirmé.'}, status=status.HTTP_403_FORBIDDEN)
        if Consultation.objects.filter(rdv=rdv).exists():
            return Response({'error': 'Une consultation existe déjà pour ce rendez-vous.'}, status=status.HTTP_400_BAD_REQUEST)

        dossier = get_object_or_404(DossierMedical, patient=rdv.patient)
        data = request.data.copy()
        data['dossier_medical'] = dossier.id
        data['medecin'] = request.user.medecin.id
        data['rdv'] = rdv.id

        serializer = ConsultationSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConsultationDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, consultation_id):
        consultation = get_object_or_404(Consultation, id=consultation_id)

        if hasattr(request.user, 'patient') and consultation.dossier_medical.patient.user == request.user:
            serializer = ConsultationSerializer(consultation)
            return Response(serializer.data)

        if hasattr(request.user, 'medecin') and consultation.medecin.user == request.user:
            serializer = ConsultationSerializer(consultation)
            return Response(serializer.data)

        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

    def put(self, request, consultation_id):
        return self._update_consultation(request, consultation_id, partial=False)

    def patch(self, request, consultation_id):
        return self._update_consultation(request, consultation_id, partial=True)

    def _update_consultation(self, request, consultation_id, partial=False):
        if not hasattr(request.user, 'medecin'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        consultation = get_object_or_404(Consultation, id=consultation_id)
        if consultation.medecin.user != request.user:
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
        if not IsNotVerrouille().has_object_permission(request, self, consultation):
            return Response({'error': 'Cette consultation est verrouillée et ne peut plus être modifiée.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ConsultationSerializer(consultation, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrdonnanceCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'medecin'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        consultation_id = request.data.get('consultation')
        if not consultation_id:
            return Response({'error': 'La consultation est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)

        consultation = get_object_or_404(Consultation, id=consultation_id)
        if consultation.medecin.user != request.user:
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
        if consultation.is_verrouille:
            return Response({'error': 'Cette consultation est verrouillée, l’ordonnance ne peut plus être modifiée.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['consultation'] = consultation.id

        serializer = OrdonnanceSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrdonnanceDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, ordonnance_id):
        return self._update_ordonnance(request, ordonnance_id, partial=False)

    def patch(self, request, ordonnance_id):
        return self._update_ordonnance(request, ordonnance_id, partial=True)

    def _update_ordonnance(self, request, ordonnance_id, partial=False):
        if not hasattr(request.user, 'medecin'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        ordonnance = get_object_or_404(Ordonnance, id=ordonnance_id)
        if ordonnance.consultation.medecin.user != request.user:
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
        if not IsNotVerrouille().has_object_permission(request, self, ordonnance):
            return Response({'error': 'Cette ordonnance est verrouillée et ne peut plus être modifiée.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrdonnanceSerializer(ordonnance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExamenCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        if not hasattr(request.user, 'medecin'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        consultation_id = request.data.get('consultation')
        patient_id = request.data.get('patient')
        dossier_id = request.data.get('dossier_medical')

        if consultation_id:
            consultation = get_object_or_404(Consultation, id=consultation_id)
            if consultation.is_verrouille:
                return Response({'error': 'Cette consultation est verrouillée, l’examen ne peut plus être modifié.'}, status=status.HTTP_403_FORBIDDEN)
            dossier = consultation.dossier_medical
        elif dossier_id:
            dossier = get_object_or_404(DossierMedical, id=dossier_id)
        elif patient_id:
            patient = get_object_or_404(Patient, id=patient_id)
            dossier = get_object_or_404(DossierMedical, patient=patient)
        else:
            return Response({'error': 'Le patient, le dossier ou la consultation est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['dossier_medical'] = dossier.id
        if consultation_id:
            data['consultation'] = consultation.id

        serializer = ExamenSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExamenResultUpdateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, examen_id):
        return self._update_resultat(request, examen_id, partial=True)

    def patch(self, request, examen_id):
        return self._update_resultat(request, examen_id, partial=True)

    def _update_resultat(self, request, examen_id, partial=False):
        if not hasattr(request.user, 'medecin'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        examen = get_object_or_404(Examen, id=examen_id)
        if examen.consultation and examen.consultation.is_verrouille and examen.resultat not in [None, '']:
            return Response({'error': 'Le résultat a déjà été renseigné et l’examen est verrouillé.'}, status=status.HTTP_403_FORBIDDEN)

        if examen.consultation and examen.consultation.is_verrouille:
            data = {'resultat': request.data.get('resultat', examen.resultat)}
            if set(request.data.keys()) - {'resultat'}:
                return Response({'error': 'Seul le champ resultat peut être renseigné après verrouillage.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            data = request.data

        serializer = ExamenSerializer(examen, data=data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class RendezVousPatientListView(generics.ListAPIView):
    serializer_class = RendezVousPatientSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RendezVous.objects.filter(
            patient=self.request.user.patient
        ).order_by('-jour', '-heure')


class RepondreContrePropositionView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, rdv_id):
        if not hasattr(request.user, 'patient'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        rdv = get_object_or_404(RendezVous, id=rdv_id, patient=request.user.patient)

        if not rdv.nouveau_jour or not rdv.nouvelle_heure:
            return Response(
                {'error': 'Aucune contre-proposition en attente pour ce rendez-vous.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reponse = request.data.get('reponse')  # 'accepter' ou 'refuser'

        if reponse == 'accepter':
            rdv.jour = rdv.nouveau_jour
            rdv.heure = rdv.nouvelle_heure
            rdv.nouveau_jour = None
            rdv.nouvelle_heure = None
            rdv.commentaire_medecin = None
            rdv.statut = 'confirme'
            rdv.save()
            return Response({'message': 'Contre-proposition acceptée', 'statut': rdv.statut})

        elif reponse == 'refuser':
            rdv.nouveau_jour = None
            rdv.nouvelle_heure = None
            rdv.commentaire_medecin = None
            rdv.statut = 'annule'
            rdv.save()
            return Response({'message': 'Contre-proposition refusée', 'statut': rdv.statut})

        return Response(
            {'error': "Le champ 'reponse' doit être 'accepter' ou 'refuser'."},
            status=status.HTTP_400_BAD_REQUEST
        )
