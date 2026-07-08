from rest_framework import serializers
from django.contrib.auth.models import User
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


class DisponibiliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disponibilite
        fields = '__all__'

    def validate(self, data):
        if data['heure_fin'] <= data['heure_debut']:
            raise serializers.ValidationError(
                "L'heure de fin doit être supérieure à l'heure de début."
            )
        return data


class MedecinSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour éviter la récursion dans CentreSanteSerializer."""

    class Meta:
        model = Medecin
        fields = ['id', 'nom', 'prenom', 'specialite']


class CentreSanteSerializer(serializers.ModelSerializer):
    medecins = MedecinSimpleSerializer(source='medecin_set', many=True, read_only=True)

    class Meta:
        model = CentreSante
        fields = ['id', 'nom', 'adresse', 'telephone', 'email', 'ville', 'latitude', 'longitude', 'medecins']


class CentreSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CentreSante
        fields = ['id', 'nom', 'ville', 'adresse', 'telephone', 'latitude', 'longitude']


class DisponibiliteSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disponibilite
        fields = ['id', 'jour', 'heure_debut', 'heure_fin']


class MedecinSerializer(serializers.ModelSerializer):
    centre_detail = CentreSimpleSerializer(source='centre', read_only=True)
    disponibilites = DisponibiliteSimpleSerializer(source='disponibilite_set', many=True, read_only=True)

    class Meta:
        model = Medecin
        fields = ['id', 'nom', 'prenom', 'specialite', 'telephone', 'email', 'centre', 'centre_detail', 'disponibilites']


class RegisterSerializer(serializers.ModelSerializer):
    telephone = serializers.CharField()
    date_naissance = serializers.DateField()
    adresse = serializers.CharField()
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'telephone', 'date_naissance', 'adresse']

    def create(self, validated_data):
        telephone = validated_data.pop('telephone')
        date_naissance = validated_data.pop('date_naissance')
        adresse = validated_data.pop('adresse')

        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )

        Patient.objects.create(
            user=user,
            telephone=telephone,
            date_naissance=date_naissance,
            adresse=adresse,
        )

        return user


class PatientSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'email', 'telephone', 'date_naissance', 'adresse']


class RendezVousSerializer(serializers.ModelSerializer):
    patient_detail = PatientSerializer(source='patient', read_only=True)
    medecin_detail = MedecinSimpleSerializer(source='medecin', read_only=True)

    class Meta:
        model = RendezVous
        fields = ['id', 'patient', 'medecin', 'jour', 'heure', 'motif', 'statut', 'patient_detail', 'medecin_detail']
        read_only_fields = ['patient']


class RendezVousPatientSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.CharField(source='medecin.nom', read_only=True)
    medecin_prenom = serializers.CharField(source='medecin.prenom', read_only=True)
    medecin_specialite = serializers.CharField(source='medecin.specialite', read_only=True)
    centre_nom = serializers.CharField(source='medecin.centre.nom', read_only=True)

    class Meta:
        model = RendezVous
        fields = [
            'id', 'jour', 'heure', 'statut', 'motif',
            'medecin_nom', 'medecin_prenom', 'medecin_specialite', 'centre_nom',
            'nouveau_jour', 'nouvelle_heure', 'commentaire_medecin',
        ]



class OrdonnanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ordonnance
        fields = ['id', 'consultation', 'medicaments', 'duree', 'instructions', 'date_emission']
        read_only_fields = ['date_emission']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        consultation = attrs.get('consultation', instance.consultation if instance else None)
        if consultation and consultation.is_verrouille:
            raise serializers.ValidationError({
                'detail': 'Cette ordonnance ne peut plus être modifiée car la consultation est verrouillée.'
            })
        return attrs


class ConsultationSerializer(serializers.ModelSerializer):
    medecin_detail = MedecinSimpleSerializer(source='medecin', read_only=True)
    ordonnance_detail = OrdonnanceSerializer(source='ordonnance', read_only=True)

    class Meta:
        model = Consultation
        fields = ['id', 'dossier_medical', 'rdv', 'medecin', 'medecin_detail', 'date', 'motif', 'diagnostic', 'traitement', 'notes', 'is_verrouille', 'ordonnance_detail']
        read_only_fields = ['date', 'is_verrouille']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        if instance is not None and instance.is_verrouille:
            raise serializers.ValidationError({
                'detail': 'Cette consultation est verrouillée et ne peut plus être modifiée.'
            })
        return attrs

    def validate_rdv(self, rdv):
        instance = getattr(self, 'instance', None)
        if rdv and Consultation.objects.filter(rdv=rdv).exclude(pk=getattr(instance, 'pk', None)).exists():
            raise serializers.ValidationError('Un rendez-vous ne peut avoir qu’une seule consultation.')
        return rdv


class DossierMedicalSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    consultations = ConsultationSerializer(many=True, read_only=True)
    examens = serializers.SerializerMethodField()

    class Meta:
        model = DossierMedical
        fields = ['id', 'patient', 'groupe_sanguin', 'allergies', 'antecedents', 'maladies_chroniques', 'date_creation', 'date_mise_a_jour', 'consultations', 'examens']

    def get_examens(self, obj):
        examens = obj.examens.all().order_by('-date')
        return ExamenSerializer(examens, many=True).data


class ExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Examen
        fields = ['id', 'dossier_medical', 'consultation', 'type_examen', 'description', 'resultat', 'fichier', 'date']
        read_only_fields = ['date']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        consultation = attrs.get('consultation', instance.consultation if instance else None)

        if consultation and consultation.is_verrouille:
            raise serializers.ValidationError({
                'detail': 'Cet examen ne peut plus être modifié car la consultation associée est verrouillée.'
            })

        if instance is not None and instance.consultation and instance.consultation.is_verrouille:
            forbidden_fields = set(attrs.keys()) - {'resultat'}
            if forbidden_fields:
                raise serializers.ValidationError({
                    'detail': 'Seul le champ resultat peut être renseigné après verrouillage de la consultation.'
                })
            if 'resultat' in attrs and instance.resultat not in [None, '']:
                raise serializers.ValidationError({
                    'detail': 'Le résultat a déjà été renseigné et ne peut plus être modifié.'
                })

        return attrs
