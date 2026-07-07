"""
Django management command to geocode CentreSante addresses using Nominatim (OpenStreetMap).

Usage:
    python manage.py geocode_centres
"""

import time
import requests
from django.core.management.base import BaseCommand
from django.db import transaction
from medical.models import CentreSante


class Command(BaseCommand):
    help = 'Géocode les adresses des centres de santé sans latitude/longitude'

    def add_arguments(self, parser):
        parser.add_argument(
            '--retry',
            action='store_true',
            help='Réessayer de géocoder les adresses qui ont déjà des coordonnées',
        )
        parser.add_argument(
            '--delay',
            type=int,
            default=1,
            help='Délai en secondes entre chaque requête API (par défaut: 1)',
        )

    def handle(self, *args, **options):
        retry = options['retry']
        delay = options['delay']

        # Filtrer les centres à géocoder
        if retry:
            centres = CentreSante.objects.all()
            self.stdout.write(self.style.WARNING(f'⚠️  Mode --retry activé. Géocodage de tous les {centres.count()} centres.'))
        else:
            centres = CentreSante.objects.filter(latitude__isnull=True) | CentreSante.objects.filter(longitude__isnull=True)
            self.stdout.write(f'🔍 Recherche des centres sans coordonnées GPS...')
            self.stdout.write(f'📍 {centres.count()} centres à géocoder')

        if not centres.exists():
            self.stdout.write(self.style.SUCCESS('✅ Tous les centres ont déjà des coordonnées GPS !'))
            return

        geocoded_count = 0
        failed_count = 0

        for index, centre in enumerate(centres, 1):
            try:
                self.stdout.write(f'[{index}/{centres.count()}] Géocodage de "{centre.nom}" ({centre.ville})...')

                # Construire l'adresse complète
                full_address = f"{centre.adresse}, {centre.ville}, Mali"

                # Utiliser l'API Nominatim d'OpenStreetMap
                response = requests.get(
                    'https://nominatim.openstreetmap.org/search',
                    params={
                        'q': full_address,
                        'format': 'json',
                        'limit': 1,
                    },
                    timeout=10,
                    headers={'User-Agent': 'MedicConnect/1.0'},  # Nominatim demande un User-Agent
                )
                response.raise_for_status()

                data = response.json()

                if data:
                    result = data[0]
                    latitude = float(result['lat'])
                    longitude = float(result['lon'])

                    with transaction.atomic():
                        centre.latitude = latitude
                        centre.longitude = longitude
                        centre.save()

                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✅ Géocodé: {latitude:.6f}, {longitude:.6f}'
                        )
                    )
                    geocoded_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⚠️  Aucun résultat pour "{full_address}"'
                        )
                    )
                    failed_count += 1

            except requests.exceptions.RequestException as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'  ❌ Erreur réseau: {str(e)}'
                    )
                )
                failed_count += 1
            except (ValueError, KeyError, IndexError) as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'  ❌ Erreur lors du traitement de la réponse: {str(e)}'
                    )
                )
                failed_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'  ❌ Erreur inattendue: {str(e)}'
                    )
                )
                failed_count += 1

            # Respecter les limites de l'API Nominatim (délai entre les requêtes)
            if index < centres.count():
                time.sleep(delay)

        # Résumé
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS(f'✅ Géocodés: {geocoded_count}'))
        if failed_count > 0:
            self.stdout.write(self.style.WARNING(f'⚠️  Échoués: {failed_count}'))
        self.stdout.write('=' * 60)

        if geocoded_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'🎉 Géocodage terminé avec succès ! {geocoded_count} centre(s) mis à jour.'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    'ℹ️  Aucun centre n\'a pu être géocodé. Vérifiez les adresses ou votre connexion réseau.'
                )
            )
