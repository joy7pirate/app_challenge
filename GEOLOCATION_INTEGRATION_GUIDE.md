# Guide d'Intégration : Géolocalisation des Centres de Santé

Ce guide explique comment intégrer et utiliser la nouvelle fonctionnalité de géolocalisation dans l'application MedaCliK.

## 📋 Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de :
- Localiser automatiquement leur position GPS
- Voir les centres de santé les plus proches
- Calculer les distances (en km)
- Ouvrir Google Maps pour l'itinéraire vers un centre

## 🔧 Installation

### 1. Backend (Django REST Framework)

#### 1.1 Appliquer les migrations

```bash
cd /path/to/backend
python manage.py migrate
```

Cela va ajouter les champs `latitude` et `longitude` au modèle `CentreSante`.

#### 1.2 Géocoder les adresses existantes

**Prérequis** : Installation de `requests` (si pas déjà installé)

```bash
pip install requests
```

**Exécution de la commande** :

```bash
# Géocoder tous les centres sans coordonnées
python manage.py geocode_centres

# Géocoder tous les centres (même ceux qui ont déjà des coordonnées)
python manage.py geocode_centres --retry

# Géocoder avec un délai personnalisé entre les requêtes (par défaut: 1 seconde)
python manage.py geocode_centres --delay 2
```

**Output attendu** :

```
🔍 Recherche des centres sans coordonnées GPS...
📍 3 centres à géocoder
[1/3] Géocodage de "Centre de Santé A" (Bamako)...
  ✅ Géocodé: 12.345678, -8.012345
[2/3] Géocodage de "Centre de Santé B" (Ségou)...
  ✅ Géocodé: 13.456789, -6.123456
[3/3] Géocodage de "Centre de Santé C" (Kayes)...
  ⚠️  Aucun résultat pour "...Kayes, Mali"
============================================================
✅ Géocodés: 2
⚠️  Échoués: 1
============================================================
🎉 Géocodage terminé avec succès ! 2 centre(s) mis à jour.
```

#### 1.3 Endpoint API mis à jour

```bash
GET /api/centres/
```

Réponse exemple :

```json
[
  {
    "id": 1,
    "nom": "Centre de Santé A",
    "adresse": "Rue de la Paix, Quartier des Hauts",
    "telephone": "+223 12345678",
    "email": "contact@centrea.ml",
    "ville": "Bamako",
    "latitude": 12.345678,
    "longitude": -8.012345,
    "medecins": [...]
  }
]
```

---

### 2. Frontend (React Native / Expo)

#### 2.1 Installer les dépendances

Les dépendances ont été ajoutées au `package.json` (notamment `expo-location`).

```bash
cd /path/to/frontend/medaclikml
npm install
# ou
yarn install
```

#### 2.2 Configurer l'URL de l'API

Éditez `constants/api.js` pour pointer vers votre backend :

```javascript
// Pour développement local (remplacez 192.168.x.x par l'IP de votre machine)
export const API_BASE_URL = 'http://192.168.x.x:8000/api';

// Pour production
export const API_BASE_URL = 'https://api.votredomaine.com/api';
```

#### 2.3 Configurer les permissions (app.json)

Ajoutez les permissions de localisation dans `app.json` :

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Nous avons besoin de votre localisation pour vous montrer les centres proches",
          "locationWhenInUsePermission": "Nous avons besoin de votre localisation pour vous montrer les centres proches"
        }
      ]
    ]
  }
}
```

#### 2.4 Accéder à l'écran

L'écran `CentresProchesScreen` est disponible via :

```javascript
// Importer l'écran
import CentresProchesScreen from '../app/centresProches';

// Ou ajouter une route dans la navigation (si utilisant Expo Router)
// Le fichier est déjà créé à app/centresProches.tsx
```

---

## 📁 Fichiers créés/modifiés

### Backend

```
medical/
├── models.py                              (✏️ modifié: ajout latitude/longitude)
├── serializers.py                         (✏️ modifié: ajout champs sérialiseurs)
├── migrations/
│   └── 0006_centresante_latitude_longitude.py  (✨ nouveau)
└── management/commands/
    └── geocode_centres.py                 (✨ nouveau)
```

### Frontend

```
medaclikml/
├── package.json                          (✏️ modifié: ajout expo-location)
├── app/
│   └── centresProches.tsx                (✨ nouveau)
├── utils/
│   └── geolocation.js                    (✨ nouveau)
└── constants/
    └── api.js                            (✨ nouveau)
```

---

## 🎨 Personnalisation du style

L'écran utilise les couleurs du thème défini dans `constants/theme.ts` :

```typescript
- theme.colors.primary       // Couleur principale (boutons, icônes)
- theme.colors.secondary     // Couleur secondaire (textes gris)
- theme.colors.accent        // Couleur d'accent (distance)
- theme.colors.text          // Couleur du texte principal
- theme.colors.background    // Couleur de fond
- theme.colors.white         // Blanc
```

### Modifier les styles

Éditez la feuille de styles à la fin de `app/centresProches.tsx` :

```typescript
const styles = StyleSheet.create({
  // Modifiez les valeurs ici
  headerTitle: {
    fontSize: 24,  // Changez la taille
    fontWeight: '700',
    // ...
  },
});
```

---

## 🔐 Permissions

### Android

Les permissions suivantes sont automatiquement déclarées (via `app.json`) :

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### iOS

Les permissions sont demandées au runtime. Utilisateur verra un pop-up :

> "MedaCliK" aimerait accéder à votre localisation

---

## 🚀 Utilisation

### 1. Lancer l'application

```bash
npm start
# Appuyez sur 's' pour démarrer sur simulator/emulator
# Ou scannez le QR code avec Expo Go
```

### 2. Naviguer vers l'écran

L'écran s'affiche automatiquement dans le flux de navigation.

### 3. Interagir

- **Première fois** : L'app demande la permission de localisation
- **Chargement** : Affiche un spinner pendant la récupération de la position
- **Liste** : Affiche les centres triés du plus proche au plus loin
- **Tap sur une carte** : Ouvre Google Maps avec l'itinéraire
- **Tirer pour rafraîchir** : Met à jour position et liste

---

## ⚙️ Configuration avancée

### Modifier la précision GPS

Dans `app/centresProches.tsx`, ligne ~100 :

```javascript
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,  // Ou Accuracy.High, Accuracy.Low
});
```

Options :
- `Location.Accuracy.Lowest` : ~5000m (+ rapide, moins précis)
- `Location.Accuracy.Low` : ~1000m
- `Location.Accuracy.Balanced` : ~100m (défaut, bon compromis)
- `Location.Accuracy.High` : ~10m
- `Location.Accuracy.Highest` : ~0-1m (+ lent, très précis)

### Modifier le rayon de recherche

Actuellement, tous les centres sont affichés. Pour limiter à un rayon (ex: 50km) :

```javascript
const sortCentresByDistance = (centres, userLat, userLon, maxDistanceKm = Infinity) => {
  return centres
    .filter((centre) => centre.latitude && centre.longitude)
    .map((centre) => ({
      ...centre,
      distance: getDistanceKm(userLat, userLon, centre.latitude, centre.longitude),
    }))
    .filter((centre) => centre.distance <= maxDistanceKm)  // ← Nouveau filtre
    .sort((a, b) => a.distance - b.distance);
};
```

---

## 🐛 Dépannage

### 1. "Permission refusée"

**Symptôme** : Message "Permission de localisation refusée"

**Solutions** :
- Cliquez sur "Réessayer"
- Allez dans les paramètres du téléphone > MedaCliK > Permissions > Localisation > "Autoriser en utilisant l'app"
- Redémarrez l'app

### 2. "Aucun centre ne s'affiche"

**Symptôme** : Message "Aucun centre trouvé"

**Solutions** :
- Vérifiez que les centres ont des coordonnées GPS (exécutez `geocode_centres` sur le backend)
- Vérifiez la connexion API (URL dans `constants/api.js`)
- Ouvrez les outils de développement et vérifiez les logs réseau

### 3. "Google Maps ne s'ouvre pas"

**Symptôme** : Clic sur un centre n'ouvre rien

**Solutions** :
- Vérifiez que Google Maps est installé (Android) ou disponible (iOS)
- Testez avec une autre app (Maps, Waze)
- Assurez-vous d'avoir une connexion Internet

### 4. "Position incorrecte"

**Symptôme** : Position est très éloignée de la réalité

**Solutions** :
- Attendez quelques secondes (GPS a besoin de temps pour se calibrer)
- Augmentez la précision : `Location.Accuracy.High`
- Testez en extérieur (GPS ne marche pas bien en intérieur)

---

## 📊 Logs pour déboguer

Activez les logs détaillés en ajoutant au début de `app/centresProches.tsx` :

```javascript
import { LogBox } from 'react-native';

// Pour voir tous les logs
console.log = (...args) => console.warn(...args);

// Ou pour de spécifiques :
console.log('UserLocation:', userLocation);
console.log('Centres:', centresTries);
```

---

## 🔄 Points d'intégration

### Ajouter un bouton dans la navigation

Dans `app/(tabs)/_layout.tsx` (ou votre fichier de navigation) :

```javascript
<Tabs.Screen
  name="centres-proches"
  options={{
    title: 'Centres proches',
    tabBarIcon: ({ color }) => <MaterialIcons name="location-on" size={24} color={color} />,
  }}
/>
```

### Intégrer dans un drawer

```javascript
<Drawer.Screen
  name="centresProches"
  options={{
    title: 'Centres de santé proches',
    drawerIcon: ({ color }) => <MaterialIcons name="local-hospital" size={24} color={color} />,
  }}
/>
```

---

## 📚 Ressources

- [Documentation Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Google Maps URL Scheme](https://developers.google.com/maps/documentation/urls/get-started)
- [Nominatim API](https://nominatim.org/)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

---

## ✅ Checklist de déploiement

- [ ] Migration Django appliquée (`python manage.py migrate`)
- [ ] Centres géocodés (`python manage.py geocode_centres`)
- [ ] `API_BASE_URL` correctement configurée dans `constants/api.js`
- [ ] Permissions ajoutées dans `app.json`
- [ ] `expo-location` installé (`npm install`)
- [ ] Écran accessible depuis la navigation
- [ ] Tests sur iOS et Android
- [ ] Google Maps testée
- [ ] Message d'erreur testés (refus permission, pas de centre, pas de connexion)

---

## 📝 Notes

- L'API Nominatim est **gratuite** mais a des limites de requêtes (1 requête/seconde par défaut)
- Le calcul de distance utilise la **formule de Haversine** (très précis pour courtes distances)
- Google Maps s'ouvre en **mode direction** (affiche le point de départ utilisateur + destination)
- Pas d'appel API externe pour le calcul de distances (performance locale)

---

Bon développement ! 🚀
