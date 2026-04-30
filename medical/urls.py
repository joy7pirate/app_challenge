from django.urls import path
from .views import (
    CentreSanteListCreateView,
    CentreSanteDetailView,
    MedecinListCreateView,
    MedecinDetailView,
    DisponibiliteListCreateView,
    DisponibiliteDetailView,
)
urlpatterns = [
    path('centres/', CentreSanteListCreateView.as_view(), name='centres'),
    path('centres/<int:pk>/', CentreSanteDetailView.as_view(), name='centre-detail'),

    path('medecins/', MedecinListCreateView.as_view(), name='medecins'),
    path('medecins/<int:pk>/', MedecinDetailView.as_view(), name='medecin-detail'),

    path('disponibilites/', DisponibiliteListCreateView.as_view(), name='disponibilites'),
    path('disponibilites/<int:pk>/', DisponibiliteDetailView.as_view(), name='disponibilite-detail'),
]