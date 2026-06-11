# MedaClick Mali 🏥

Plateforme numérique de santé pour le Mali permettant la prise de rendez-vous médicaux en ligne, la gestion des disponibilités par les médecins et le suivi de l'Assurance Maladie Obligatoire (AMO).

---

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du projet](#architecture-du-projet)
3. [Prérequis](#prérequis)
4. [Installation et démarrage](#installation-et-démarrage)
5. [Structure du backend](#structure-du-backend)
6. [Structure du frontend web](#structure-du-frontend-web)
7. [API Reference](#api-reference)
8. [Fonctionnalités](#fonctionnalités)
9. [Rôles utilisateurs](#rôles-utilisateurs)
10. [Système AMO](#système-amo)
11. [Variables d'environnement](#variables-denvironnement)
12. [Améliorations futures](#améliorations-futures)

---

## Vue d'ensemble

MedaClick Mali est une application fullstack composée de :

- Un **backend Django REST Framework** qui expose une API JSON pour la gestion des médecins, centres de santé et disponibilités
- Un **frontend web React + Vite + TailwindCSS** qui consomme cette API et offre deux interfaces distinctes : patient et médecin

```
Navigateur (localhost:3000)
        ↕  HTTP fetch() + JSON
Backend Django (localhost:8000)
        ↕  SQL
Base de données SQLite (db.sqlite3)
```

---

## Architecture du projet

```
app_challenge/
│
├── config/                          # Configuration Django
│   ├── settings.py                  # Paramètres (INSTALLED_APPS, CORS, DB...)
│   ├── urls.py                      # Routes racine
│   ├── wsgi.py
│   └── asgi.py
│
├── medical/                         # Application Django principale
│   ├── models.py                    # CentreSante, Medecin, Disponibilite
│   ├── serializers.py               # Conversion objets Python ↔ JSON
│   ├── views.py                     # ViewSets DRF (logique API)
│   ├── urls.py                      # Routes /api/
│   └── migrations/                  # Migrations base de données
│
├── frontEnd/
│   └── web/                         # Application web React
│       ├── index.html
│       ├── vite.config.js
│       ├── package.json
│       └── src/
│           ├── App.jsx              # Racine : routing selon le rôle
│           ├── api.js               # Appels HTTP vers l'API Django
│           ├── main.jsx             # Point d'entrée React
│           ├── index.css            # Tailwind v4 + styles globaux
│           │
│           ├── constants/
│           │   └── index.js         # Couleurs, AMO_RATE, filtres, données démo
│           │
│           ├── hooks/
│           │   └── useAppData.js    # Tout le state et la logique métier
│           │
│           └── components/
│               ├── auth/
│               │   ├── AuthScreen.jsx        # Login + Inscription
│               │   └── DoctorAuthFields.jsx  # Champs identification médecin
│               │
│               ├── doctor/
│               │   ├── DoctorDashboard.jsx   # Shell dashboard médecin
│               │   ├── RdvCard.jsx           # Carte RDV + StatusBadge
│               │   └── tabs/
│               │       ├── RequestsTab.jsx   # Demandes de RDV
│               │       ├── PlanningTab.jsx   # Planning semaine
│               │       ├── DisposTab.jsx     # Gestion disponibilités
│               │       └── StatsTab.jsx      # Statistiques et revenus
│               │
│               ├── patient/
│               │   ├── PatientApp.jsx        # Shell application patient
│               │   ├── BottomNav.jsx         # Barre navigation bas
│               │   └── tabs/
│               │       ├── HomeTab.jsx       # Accueil
│               │       ├── DoctorsTab.jsx    # Liste médecins + filtres
│               │       ├── HospitalsTab.jsx  # Centres de santé
│               │       ├── AiChatTab.jsx     # Assistant IA santé
│               │       └── ProfileTab.jsx    # Profil + RDV + AMO
│               │
│               └── shared/
│                   ├── DoctorDetailView.jsx  # Profil complet d'un médecin
│                   └── BookingView.jsx       # Formulaire de réservation
│
├── manage.py
├── db.sqlite3
└── requirements.txt
```

---

## Prérequis

**Backend :**
- Python 3.10+
- pip

**Frontend :**
- Node.js 18+
- npm 9+

---

## Installation et démarrage

### 1. Cloner / ouvrir le projet

```bash
cd app_challenge
```

### 2. Backend Django

```bash
# Créer et activer l'environnement virtuel
python -m venv venv

# Windows PowerShell
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations (crée db.sqlite3)
python manage.py migrate

# (Optionnel) Créer un superutilisateur pour l'interface admin
python manage.py createsuperuser

# Lancer le serveur (accessible depuis le réseau local)
python manage.py runserver 0.0.0.0:8000
```

Le backend est accessible sur `http://localhost:8000`
L'interface admin est sur `http://localhost:8000/admin/`

### 3. Frontend web

Ouvrir un **second terminal** :

```bash
cd app_challenge/frontEnd/web

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend est accessible sur `http://localhost:3000`

### 4. Vérification

Ouvrir dans le navigateur :
- `http://localhost:8000/api/medecins/` → doit retourner `[]` ou une liste JSON
- `http://localhost:8000/api/centres/` → idem
- `http://localhost:3000` → interface MedaClick

### 5. Ajouter des données de test

```bash
# Dans le terminal backend (venv activé)
python manage.py shell
```

```python
from medical.models import CentreSante, Medecin, Disponibilite

c = CentreSante.objects.create(
    nom="Hôpital Gabriel Touré",
    adresse="Rue Baba Diarra, Bamako",
    telephone="+223 20 22 27 02",
    email="gabriel@sante.ml",
    ville="Bamako"
)

m = Medecin.objects.create(
    nom="Traoré",
    prenom="Moussa",
    specialite="Cardiologue",
    telephone="+223 76 00 11 22",
    email="traore@sante.ml",
    centre=c
)

Disponibilite.objects.create(medecin=m, jour="lundi", heure_debut="08:00", heure_fin="12:00")
Disponibilite.objects.create(medecin=m, jour="mercredi", heure_debut="14:00", heure_fin="17:00")

print("✅ Données créées !")
exit()
```

---

## Structure du backend

### Modèles (`medical/models.py`)

**CentreSante**

| Champ     | Type         | Description              |
|-----------|--------------|--------------------------|
| nom       | CharField    | Nom du centre            |
| adresse   | CharField    | Adresse complète         |
| telephone | CharField    | Numéro de téléphone      |
| email     | EmailField   | Email de contact         |
| ville     | CharField    | Ville (ex : Bamako)      |

**Medecin**

| Champ     | Type        | Description                        |
|-----------|-------------|------------------------------------|
| nom       | CharField   | Nom de famille                     |
| prenom    | CharField   | Prénom                             |
| specialite| CharField   | Spécialité médicale                |
| telephone | CharField   | Téléphone                          |
| email     | EmailField  | Email professionnel                |
| centre    | FK→Centre   | Centre de santé d'appartenance     |

**Disponibilite**

| Champ       | Type      | Description                    |
|-------------|-----------|--------------------------------|
| medecin     | FK→Medecin| Médecin concerné               |
| jour        | CharField | Jour (ex : "lundi")            |
| heure_debut | TimeField | Heure de début (ex : "08:00")  |
| heure_fin   | TimeField | Heure de fin (ex : "12:00")    |

### Sérialiseurs (`medical/serializers.py`)

Les sérialiseurs convertissent les objets Python en JSON. Ils sont imbriqués pour éviter les requêtes multiples :

- `MedecinSerializer` → inclut `centre_detail` + `disponibilites`
- `CentreSanteSerializer` → inclut la liste simplifiée des médecins
- `DisponibiliteSerializer` → données brutes du créneau

### Vues (`medical/views.py`)

Utilise `ModelViewSet` de Django REST Framework avec filtrage automatique via `DjangoFilterBackend`.

---

## API Reference

Base URL : `http://localhost:8000/api/`

### Médecins

| Méthode | Endpoint              | Description                            |
|---------|-----------------------|----------------------------------------|
| GET     | `/medecins/`          | Liste tous les médecins                |
| GET     | `/medecins/?specialite=Cardiologue` | Filtre par spécialité  |
| GET     | `/medecins/?centre=1` | Filtre par centre                      |
| GET     | `/medecins/{id}/`     | Détail d'un médecin                    |
| POST    | `/medecins/`          | Créer un médecin                       |
| PUT     | `/medecins/{id}/`     | Modifier un médecin                    |
| DELETE  | `/medecins/{id}/`     | Supprimer un médecin                   |

### Centres de santé

| Méthode | Endpoint              | Description                            |
|---------|-----------------------|----------------------------------------|
| GET     | `/centres/`           | Liste tous les centres                 |
| GET     | `/centres/?ville=Bamako` | Filtre par ville                    |
| GET     | `/centres/{id}/`      | Détail d'un centre                     |
| POST    | `/centres/`           | Créer un centre                        |

### Disponibilités

| Méthode | Endpoint                          | Description                       |
|---------|-----------------------------------|-----------------------------------|
| GET     | `/disponibilites/`                | Liste toutes les disponibilités   |
| GET     | `/disponibilites/?medecin=1`      | Créneaux d'un médecin             |
| GET     | `/disponibilites/?jour=lundi`     | Créneaux d'un jour donné          |
| POST    | `/disponibilites/`                | Créer un créneau                  |
| DELETE  | `/disponibilites/{id}/`           | Supprimer un créneau              |

### Exemple de réponse `/api/medecins/`

```json
[
  {
    "id": 1,
    "nom": "Traoré",
    "prenom": "Moussa",
    "specialite": "Cardiologue",
    "telephone": "+223 76 00 11 22",
    "email": "traore@sante.ml",
    "centre_detail": {
      "id": 1,
      "nom": "Hôpital Gabriel Touré",
      "adresse": "Rue Baba Diarra, Bamako",
      "ville": "Bamako"
    },
    "disponibilites": [
      {
        "id": 1,
        "jour": "lundi",
        "heure_debut": "08:00:00",
        "heure_fin": "12:00:00"
      }
    ]
  }
]
```

---

## Fonctionnalités

### Application patient

| Fonctionnalité             | Description                                                  |
|----------------------------|--------------------------------------------------------------|
| Recherche de médecins      | Par nom, prénom, spécialité ou centre                        |
| Filtres par spécialité     | Cardiologie, Pédiatrie, Neurologie, Dentiste, Généraliste    |
| Profil médecin             | Informations complètes, créneaux sélectionnables             |
| Réservation de RDV         | Formulaire avec nom, téléphone, motif                        |
| Prise en charge AMO        | Toggle ON/OFF, saisie du numéro, calcul automatique          |
| Centres de santé           | Vue carte + liste interactive                                |
| Assistant IA               | Chatbot médical avec réponses par mots-clés                  |
| Profil & historique        | Mes RDV, carte AMO, paramètres du compte                     |

### Dashboard médecin

| Fonctionnalité             | Description                                                  |
|----------------------------|--------------------------------------------------------------|
| Identification sécurisée   | Vérification nom + email contre la base de données           |
| Demandes de RDV            | Vue organisée En attente / Acceptés / Refusés                |
| Accepter / Refuser         | Boutons d'action sur chaque demande                          |
| Annuler un RDV accepté     | Possibilité de revenir sur une décision                      |
| Planning semaine           | Vue par jour avec créneaux et RDV                            |
| Gestion des disponibilités | Ajouter / supprimer des créneaux (jour + horaires)           |
| Statistiques               | Compteurs, revenus FCFA, taux d'acceptation, profil médical  |

---

## Rôles utilisateurs

### Patient

1. S'inscrire avec nom, email, téléphone, mot de passe
2. Accès à l'interface de recherche et réservation
3. Un numéro AMO est généré automatiquement à l'inscription

**Connexion démo rapide :** cliquer sur "Accès Démo Patient" sans saisir d'identifiants.

### Médecin

Le médecin **doit être préalablement enregistré** dans la base de données par un administrateur via :
- L'interface admin Django (`/admin/`)
- Ou le shell Django (`python manage.py shell`)

**Identification :** saisir le **nom de famille** et l'**email** tels qu'enregistrés en base. Le système vérifie en appelant `GET /api/medecins/` et compare les valeurs (insensible à la casse).

Si la correspondance est trouvée → accès au dashboard médecin.
Si non → message d'erreur.

---

## Système AMO

L'AMO (Assurance Maladie Obligatoire) est le régime d'assurance santé malien.

**Paramètres :**

| Paramètre          | Valeur   |
|--------------------|----------|
| Taux de couverture | 70%      |
| Reste à charge     | 30%      |
| Tarif consultation | 12 000 FCFA |

**Calcul :**

```
Consultation :    12 000 FCFA
AMO (70%) :      - 8 400 FCFA
Patient paie :     3 600 FCFA
```

Le toggle AMO dans le formulaire de réservation met à jour le récapitulatif en temps réel.

---

## Variables d'environnement

### Backend (`config/settings.py`)

| Variable              | Valeur actuelle      | Description                          |
|-----------------------|----------------------|--------------------------------------|
| `SECRET_KEY`          | (valeur Django)      | Clé secrète — à changer en production|
| `DEBUG`               | `True`               | Mettre `False` en production         |
| `ALLOWED_HOSTS`       | `['*']`              | Restreindre en production            |
| `CORS_ALLOWED_ORIGINS`| `localhost:3000`     | Origines autorisées pour le frontend |

### Frontend (`src/api.js`)

| Variable  | Valeur actuelle           | Description            |
|-----------|---------------------------|------------------------|
| `API_URL`  | `http://localhost:8000/api` | URL de base de l'API |

Pour changer l'URL de l'API (ex : déploiement) modifier la constante dans `src/api.js` :

```javascript
const API_URL = 'https://votre-domaine.com/api';
```

---

## Stack technique

### Backend

| Technologie              | Version | Rôle                          |
|--------------------------|---------|-------------------------------|
| Python                   | 3.10+   | Langage                       |
| Django                   | 6.x     | Framework web                 |
| Django REST Framework    | 3.17+   | API REST                      |
| django-filter            | 24.x    | Filtrage des querysets        |
| django-cors-headers      | 4.x     | Gestion CORS                  |
| SQLite                   | —       | Base de données (dev)         |

### Frontend

| Technologie   | Version | Rôle                          |
|---------------|---------|-------------------------------|
| React         | 19.x    | Interface utilisateur         |
| Vite          | 6.x     | Bundler et serveur de dev     |
| TailwindCSS   | 4.x     | Styles utilitaires            |
| Motion        | 12.x    | Animations (framer-motion)    |
| Lucide React  | 0.546   | Icônes                        |

---

## Améliorations futures

Les éléments suivants sont identifiés comme prioritaires pour rendre l'application production-ready :

**Backend (critiques)**

- Ajouter le modèle `RendezVous` avec les champs `patient_nom`, `patient_telephone`, `motif`, `statut`, `disponibilite` (FK), `amo_numero`, `created_at` — actuellement les réservations ne sont pas persistées
- Implémenter l'authentification JWT avec `djangorestframework-simplejwt` — l'API est actuellement entièrement publique
- Ajouter un champ `is_booked` sur `Disponibilite` pour empêcher les doubles réservations
- Passer de SQLite à PostgreSQL pour la production
- Ajouter la pagination sur tous les endpoints (`PageNumberPagination`)
- Configurer les variables sensibles dans un fichier `.env`

**Frontend**

- Brancher l'API Gemini dans `useAppData.js → handleSendChat` pour un vrai assistant IA
- Connecter `handleConfirmBooking` à un `POST /api/rendezvous/` pour persister les RDV
- Ajouter la gestion des erreurs réseau avec retry automatique
- Implémenter un système de notifications en temps réel (WebSocket) pour alerter le médecin des nouvelles demandes
- Ajouter la géolocalisation pour afficher les centres sur une vraie carte (Leaflet ou Google Maps)

**Sécurité**

- Valider les données côté backend (le frontend ne doit jamais être la seule barrière)
- Mettre en place un rate limiting sur l'API
- Utiliser HTTPS en production
- Stocker le mot de passe médecin hashé plutôt que de vérifier par nom + email

---

## Lancer en production

> ⚠️ Ce projet est en phase de développement. Les paramètres ci-dessous sont indicatifs.

```bash
# Backend
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000

# Frontend
npm run build
# Servir le dossier dist/ avec nginx ou un CDN
```

---

## Auteur

Projet réalisé dans le cadre d'un challenge de développement fullstack — plateforme de santé numérique pour le Mali.

**Technologies principales :** Django REST Framework · React · Vite · TailwindCSS · SQLite
