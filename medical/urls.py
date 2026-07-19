from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    MedecinDashboardView,
    changer_statut_rdv,
    me_view,
    rdv_medecin,
    CentreSanteListCreateView,
    CentreSanteDetailView,
    MedecinListCreateView,
    MedecinDetailView,
    DisponibiliteListCreateView,
    DisponibiliteDetailView,
    RendezVousListCreateView,
    RendezVousDetailView,
    RendezVousPatientListView,        
    RepondreContrePropositionView,    
    RegisterView,
    login_view,
    DossierPatientView,
    MedecinPatientDossierView,
    ConsultationCreateView,
    ConsultationDetailView,
    OrdonnanceCreateView,
    OrdonnanceDetailView,
    ExamenCreateView,
    ExamenResultUpdateView,
    PatientViewSet,
)

urlpatterns = [
    path('centres/', CentreSanteListCreateView.as_view(), name='centres'),
    path('centres/<int:pk>/', CentreSanteDetailView.as_view(), name='centre-detail'),

    path('medecins/', MedecinListCreateView.as_view(), name='medecins'),
    path('medecins/<int:pk>/', MedecinDetailView.as_view(), name='medecin-detail'),

    path('disponibilites/', DisponibiliteListCreateView.as_view(), name='disponibilites'),
    path('disponibilites/<int:pk>/', DisponibiliteDetailView.as_view(), name='disponibilite-detail'),

    path('rendezvous/', RendezVousListCreateView.as_view(), name='rendezvous-list'),
    path('rendezvous/<int:pk>/', RendezVousDetailView.as_view(), name='rendezvous-detail'),

    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', login_view, name='login'),

    path('medecin/dashboard/', MedecinDashboardView.as_view(), name='medecin-dashboard'),
    path('auth/me/', me_view, name='me'),
    path('rendezvous/medecin/', rdv_medecin, name='rdv-medecin'),
    path('rendezvous/<int:rdv_id>/statut/', changer_statut_rdv, name='changer-statut-rdv'),

    path('patient/dossier/', DossierPatientView.as_view(), name='patient-dossier'),
    path('medecin/patient/<int:patient_id>/dossier/', MedecinPatientDossierView.as_view(), name='medecin-patient-dossier'),
    path('consultations/create/', ConsultationCreateView.as_view(), name='consultation-create'),
    path('consultations/<int:consultation_id>/', ConsultationDetailView.as_view(), name='consultation-detail'),
    path('ordonnances/create/', OrdonnanceCreateView.as_view(), name='ordonnance-create'),
    path('ordonnances/<int:ordonnance_id>/', OrdonnanceDetailView.as_view(), name='ordonnance-detail'),
    path('examens/create/', ExamenCreateView.as_view(), name='examen-create'),
    path('examens/<int:examen_id>/resultat/', ExamenResultUpdateView.as_view(), name='examen-resultat'),


    path('rendezvous/patient/', RendezVousPatientListView.as_view(), name='rendezvous-patient-list'),
    path('rendezvous/<int:rdv_id>/repondre/', RepondreContrePropositionView.as_view(), name='rendezvous-repondre'),


      path('patients/', PatientViewSet.as_view({
        'get': 'list',
    }), name='patients-list'),
    path('patients/<int:pk>/', PatientViewSet.as_view({
        'patch': 'partial_update',
        'put': 'partial_update',
    }), name='patients-detail'),
     path("chatbot/", include("chatbot.urls")),
]