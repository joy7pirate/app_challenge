from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from .models import Patient, DossierMedical, Medecin, Consultation, Examen, CentreSante, RendezVous


class DossierMedicalSignalTests(TestCase):
    def test_patient_creation_creates_dossier_medical(self):
        user = User.objects.create_user(
            username='patient-test',
            email='patient@example.com',
            password='motdepasse123'
        )

        patient = Patient.objects.create(
            user=user,
            telephone='0600000000',
            date_naissance='1990-01-01',
            adresse='1 rue de Paris'
        )

        self.assertTrue(DossierMedical.objects.filter(patient=patient).exists())


class MedicDossierApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient_user = User.objects.create_user(
            username='patient-api',
            email='patient-api@example.com',
            password='motdepasse123'
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            telephone='0600000001',
            date_naissance='1992-02-02',
            adresse='10 rue de Lyon'
        )
        self.dossier = DossierMedical.objects.get(patient=self.patient)

        self.medecin_user = User.objects.create_user(
            username='medecin-api',
            email='medecin-api@example.com',
            password='motdepasse123'
        )
        self.centre = CentreSante.objects.create(
            nom='Centre Test',
            adresse='1 rue Test',
            telephone='0100000000',
            email='centre@example.com',
            ville='Paris'
        )
        self.medecin = Medecin.objects.create(
            user=self.medecin_user,
            nom='Durand',
            prenom='Alice',
            specialite='Cardiologie',
            telephone='0700000000',
            email='medecin-api@example.com',
            centre=self.centre
        )

    def test_medecin_can_create_consultation_for_confirmed_rdv(self):
        rdv = RendezVous.objects.create(
            patient=self.patient,
            medecin=self.medecin,
            jour='2026-07-10',
            heure='10:00:00',
            motif='Suivi',
            statut='confirme',
        )
        self.client.force_authenticate(user=self.medecin_user)

        response = self.client.post(
            '/api/consultations/create/',
            {'rdv': rdv.id, 'motif': 'Douleur thoracique', 'diagnostic': 'Inspection'},
            format='json'
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Consultation.objects.filter(rdv=rdv).exists())

    def test_accepting_rdv_allows_medecin_access_to_patient_dossier(self):
        rdv = RendezVous.objects.create(
            patient=self.patient,
            medecin=self.medecin,
            jour='2026-07-11',
            heure='11:00:00',
            motif='Contrôle',
            statut='en_attente',
        )
        self.client.force_authenticate(user=self.medecin_user)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/statut/',
            {'statut': 'accepte'},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['statut'], 'confirme')

        dossier_response = self.client.get(f'/api/medecin/patient/{self.patient.id}/dossier/')
        self.assertEqual(dossier_response.status_code, 200)

    def test_status_termine_verrouille_consultation(self):
        rdv = RendezVous.objects.create(
            patient=self.patient,
            medecin=self.medecin,
            jour='2026-07-11',
            heure='11:00:00',
            motif='Contrôle',
            statut='confirme',
        )
        consultation = Consultation.objects.create(
            dossier_medical=self.dossier,
            medecin=self.medecin,
            rdv=rdv,
            motif='Douleur thoracique',
            diagnostic='Inspection',
        )
        self.client.force_authenticate(user=self.medecin_user)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/statut/',
            {'statut': 'termine'},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        consultation.refresh_from_db()
        self.assertTrue(consultation.is_verrouille)

    def test_medecin_can_update_patient_dossier(self):
        rdv = RendezVous.objects.create(
            patient=self.patient,
            medecin=self.medecin,
            jour='2026-07-12',
            heure='12:00:00',
            motif='Consultation',
            statut='confirme',
        )
        self.client.force_authenticate(user=self.medecin_user)

        response = self.client.patch(
            f'/api/medecin/patient/{self.patient.id}/dossier/',
            {'groupe_sanguin': 'A+'},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.groupe_sanguin, 'A+')

    def test_medecin_can_update_examen_result(self):
        examen = Examen.objects.create(
            dossier_medical=self.dossier,
            type_examen='analyse',
            description='Analyse sanguine',
        )
        self.client.force_authenticate(user=self.medecin_user)

        response = self.client.put(
            f'/api/examens/{examen.id}/resultat/',
            {'resultat': 'Résultat normal'},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        examen.refresh_from_db()
        self.assertEqual(examen.resultat, 'Résultat normal')
