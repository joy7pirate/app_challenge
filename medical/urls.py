from django.urls import path
from .views import CentreSanteListCreateView, MedecinListCreateView, DisponibiliteListCreateView

urlpatterns = [
    path('centres/', CentreSanteListCreateView.as_view(), name='centres'),
    path('medecins/', MedecinListCreateView.as_view(), name='medecins'),
    path('disponibilites/', DisponibiliteListCreateView.as_view(), name='disponibilites'),
]