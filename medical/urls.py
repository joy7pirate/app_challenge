from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import MedecinDashboardView, changer_statut_rdv, me_view, rdv_medecin

from .views import (
    CentreSanteListCreateView,
    CentreSanteDetailView,
    MedecinListCreateView,
    MedecinDetailView,
    DisponibiliteListCreateView,
    DisponibiliteDetailView,
    RendezVousListCreateView,
    RendezVousDetailView,
    RegisterView,
    login_view,
)
urlpatterns = [
    path('centres/', CentreSanteListCreateView.as_view(), name='centres'),
    path('centres/<int:pk>/', CentreSanteDetailView.as_view(), name='centre-detail'),

    path('medecins/', MedecinListCreateView.as_view(), name='medecins'),
    path('medecins/<int:pk>/', MedecinDetailView.as_view(), name='medecin-detail'),

    path('disponibilites/', DisponibiliteListCreateView.as_view(), name='disponibilites'),
    path('disponibilites/<int:pk>/', DisponibiliteDetailView.as_view(), name='disponibilite-detail'),
 
    path('rendezvous/', RendezVousListCreateView.as_view()),
    path('rendezvous/<int:pk>/', RendezVousDetailView.as_view()),

    path('register/', RegisterView.as_view(), name='register'),
     path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),       # login
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # refresh
    path('login/', login_view, name='login'),

    path('medecin/dashboard/', MedecinDashboardView.as_view(), name='medecin-dashboard'),


path('auth/me/', me_view, name='me'),

path('rendezvous/medecin/', rdv_medecin),
path('rendezvous/<int:rdv_id>/statut/', changer_statut_rdv),
    
]