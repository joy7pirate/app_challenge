# Code Snippets à Copier/Coller

Les fichiers ont déjà été créés, mais voici les snippets clés pour référence et modifications.

---

## 🔧 Backend Django - Snippets

### ✅ models.py - Modèle CentreSante (final)

```python
class CentreSante(models.Model):
    nom = models.CharField(max_length=100)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20)
    email = models.EmailField()
    ville = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True)    # ← NOUVEAU
    longitude = models.FloatField(null=True, blank=True)   # ← NOUVEAU

    def __str__(self):
        return self.nom
```

### ✅ serializers.py - Serializers mis à jour

```python
class CentreSanteSerializer(serializers.ModelSerializer):
    medecins = MedecinSimpleSerializer(source='medecin_set', many=True, read_only=True)

    class Meta:
        model = CentreSante
        fields = ['id', 'nom', 'adresse', 'telephone', 'email', 'ville', 
                  'latitude', 'longitude', 'medecins']  # ← AJOUT CHAMPS


class CentreSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CentreSante
        fields = ['id', 'nom', 'ville', 'adresse', 'telephone', 
                  'latitude', 'longitude']  # ← AJOUT CHAMPS
```

### ✅ settings.py - Ajouter requests (optionnel)

```python
INSTALLED_APPS = [
    # ...
    'medical',
]

# Vous aurez besoin de: pip install requests
```

### ✅ Commande de management - Utilisation

```bash
# Géocoder tous les centres sans coordonnées
python manage.py geocode_centres

# Output attendu:
# 🔍 Recherche des centres sans coordonnées GPS...
# 📍 3 centres à géocoder
# [1/3] Géocodage de "Centre A"...
#   ✅ Géocodé: 12.345678, -8.012345
# [2/3] Géocodage de "Centre B"...
#   ✅ Géocodé: 13.456789, -6.123456
# [3/3] Géocodage de "Centre C"...
#   ⚠️  Aucun résultat
# ====================================
# ✅ Géocodés: 2
# ⚠️  Échoués: 1
```

---

## 🎨 Frontend React Native - Snippets

### ✅ package.json - Dépendances

```json
{
  "dependencies": {
    "expo": "~54.0.33",
    "expo-location": "~17.0.1",
    "react-native": "0.81.5",
    "react": "19.1.0"
    // ... autres dépendances
  }
}
```

### ✅ app.json - Permissions de localisation

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Nous avons besoin de votre localisation pour vous montrer les centres de santé les plus proches.",
          "locationWhenInUsePermission": "Nous avons besoin de votre localisation pour vous montrer les centres de santé les plus proches."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Nous avons besoin de votre localisation pour vous montrer les centres proches.",
        "NSLocationAlwaysUsageDescription": "Nous utilisons votre localisation pour vous proposer les centres proches.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Nous utilisons votre localisation pour vous proposer les centres proches."
      }
    },
    "android": {
      "permissions": [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### ✅ constants/api.js - Configuration

```javascript
// Remplacez localhost:8000 par votre URL réelle
export const API_BASE_URL = 'http://localhost:8000/api';

// Pour développement local avec IP:
// export const API_BASE_URL = 'http://192.168.1.100:8000/api';

// Pour production:
// export const API_BASE_URL = 'https://api.votredomaine.com/api';
```

### ✅ utils/geolocation.js - Fonctions clés

```javascript
// Calculer distance entre deux points (Haversine)
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Formater distance (arrondir à 1 décimale)
export const formatDistance = (distanceKm) => distanceKm.toFixed(1);

// Ouvrir Google Maps avec itinéraire
export const openGoogleMapsDirections = async (latitude, longitude) => {
  const { Linking } = require('react-native');
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  return await Linking.openURL(url);
};

// Trier centres par distance
export const sortCentresByDistance = (centres, userLat, userLon) => {
  return centres
    .filter((c) => c.latitude && c.longitude)
    .map((c) => ({
      ...c,
      distance: getDistanceKm(userLat, userLon, c.latitude, c.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);
};
```

### ✅ app/centresProches.tsx - Logique principale

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { sortCentresByDistance, openGoogleMapsDirections } from '../utils/geolocation';
import { API_BASE_URL } from '../constants/api';

export default function CentresProchesScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [centresTries, setCentresTries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer position GPS
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission refusée');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (err) {
        setError('Erreur GPS');
      }
    };

    getLocation();
  }, []);

  // Charger centres de l'API
  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/centres/`);
        const data = await response.json();

        if (userLocation) {
          const sorted = sortCentresByDistance(
            data,
            userLocation.latitude,
            userLocation.longitude
          );
          setCentresTries(sorted);
        }

        setLoading(false);
      } catch (err) {
        setError('Erreur API');
        setLoading(false);
      }
    };

    if (userLocation) {
      fetchCentres();
    }
  }, [userLocation]);

  // Ouvrir Google Maps
  const handleOpenMaps = async (centre) => {
    try {
      await openGoogleMapsDirections(centre.latitude, centre.longitude);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir Google Maps');
    }
  };

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>{error}</Text>;

  return (
    <View>
      <FlatList
        data={centresTries}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleOpenMaps(item)}>
            <Text>{item.nom} - {item.distance?.toFixed(1)} km</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}
```

---

## 🧭 Navigation - Snippets

### ✅ Ajouter comme onglet (bottom tabs)

```typescript
// app/(tabs)/_layout.tsx

<Tabs.Screen
  name="centres-proches"
  options={{
    title: 'Centres proches',
    tabBarIcon: ({ color }) => (
      <MaterialIcons name="location-on" size={24} color={color} />
    ),
  }}
/>
```

### ✅ Intégrer dans le drawer

```typescript
<Drawer.Screen
  name="CentresProches"
  component={CentresProchesScreen}
  options={{
    drawerLabel: 'Centres de santé proches',
    drawerIcon: ({ color }) => (
      <MaterialIcons name="local-hospital" size={24} color={color} />
    ),
  }}
/>
```

### ✅ Naviguer depuis un bouton

```typescript
import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('CentresProches')}
    >
      <Text>Voir les centres proches</Text>
    </TouchableOpacity>
  );
};
```

---

## ✅ Checklist de déploiement

- [ ] Migration Django appliquée
- [ ] Centres géocodés
- [ ] API retourne latitude/longitude
- [ ] expo-location installé (npm install)
- [ ] API_BASE_URL configurée
- [ ] Permissions dans app.json
- [ ] Écran intégré à la navigation
- [ ] Tested sur device réel
- [ ] Google Maps s'ouvre correctement
- [ ] Gestion d'erreurs fonctionnelle

---

## 🐛 Dépannage rapide

**Problem: "Aucun centre ne s'affiche"**
```
1. Vérifiez que les centres ont latitude/longitude:
   python manage.py geocode_centres

2. Vérifiez l'API retourne les données:
   curl http://localhost:8000/api/centres/

3. Vérifiez la connexion (logs Expo)
```

**Problem: "Google Maps ne s'ouvre pas"**
```
1. Testez l'URL dans le navigateur:
   https://www.google.com/maps/dir/?api=1&destination=12.345,-8.012

2. Vérifiez que Google Maps est installée

3. Vérifiez la connexion Internet
```

**Problem: "GPS ne fonctionne pas"**
```
1. Testez sur device réel (pas émulateur)

2. Augmentez la précision:
   Location.Accuracy.High

3. Testez en extérieur (GPS faible en intérieur)
```

---

Version: 1.0
Dernière mise à jour: 2026-01-06
