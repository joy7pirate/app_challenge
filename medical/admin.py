from django.contrib import admin
from .models import CentreSante, Medecin, Disponibilite

# Register your models here.

admin.site.register(CentreSante)
admin.site.register(Medecin)
admin.site.register(Disponibilite)