# Exemples d'Intégration - Écran Centres Proches

Ce fichier contient des exemples de code pour intégrer l'écran `CentresProchesScreen` dans votre navigation.

## 🗂️ Option 1: Ajouter comme onglet (Bottom Tabs)

Si vous utilisez une navigation par onglets inférieurs (tabs), modifiez votre fichier de navigation:

```typescript
// app/(tabs)/_layout.tsx

import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* 👇 NOUVEAU: Ajouter cet onglet */}
      <Tabs.Screen
        name="centres-proches"
        options={{
          title: 'Centres proches',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="location-on" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

Puis créez le fichier: `app/(tabs)/centres-proches.tsx`

```typescript
// app/(tabs)/centres-proches.tsx
import CentresProchesScreen from '../centresProches';

export default CentresProchesScreen;
```

---

## 🗂️ Option 2: Ajouter en Drawer Navigation

Si vous avez un menu drawer (latéral):

```typescript
// Navigation/DrawerNavigator.tsx

import CentresProchesScreen from '../app/centresProches';
import { MaterialIcons } from '@expo/vector-icons';

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: colors.primary,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerLabel: 'Accueil',
          drawerIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* 👇 NOUVEAU: Ajouter cet écran */}
      <Drawer.Screen
        name="CentresProches"
        component={CentresProchesScreen}
        options={{
          drawerLabel: 'Centres de santé proches',
          drawerIcon: ({ color }) => (
            <MaterialIcons name="local-hospital" size={24} color={color} />
          ),
          headerTitle: 'Centres proches',
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerLabel: 'Mon profil',
          drawerIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
```

---

## 🗂️ Option 3: Ajouter comme écran enfant (Stack Navigation)

Si vous avez une navigation en pile (stack):

```typescript
// Navigation/RootStack.tsx

import CentresProchesScreen from '../app/centresProches';
import { MaterialIcons } from '@expo/vector-icons';

export default function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Accueil' }}
      />

      {/* 👇 NOUVEAU: Ajouter cet écran */}
      <Stack.Screen
        name="CentresProches"
        component={CentresProchesScreen}
        options={{
          title: 'Centres proches',
          headerRight: () => (
            <MaterialIcons
              name="info"
              size={24}
              color="white"
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />

      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ title: 'Détails' }}
      />
    </Stack.Navigator>
  );
}
```

Puis naviguez vers l'écran:

```typescript
// D'où que ce soit dans votre app
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

## 🎯 Option 4: Intégrer dans un bouton existant

Naviguez vers l'écran depuis n'importe quel bouton:

```typescript
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity, Text } from 'react-native';

export default function MyScreen() {
  const navigation = useNavigation();

  const handleFindNearby = () => {
    navigation.navigate('CentresProches');
  };

  return (
    <TouchableOpacity onPress={handleFindNearby}>
      <Text>🏥 Trouver un centre près de moi</Text>
    </TouchableOpacity>
  );
}
```

---

## 🎨 Option 5: Ajouter un bouton flottant (FAB)

```typescript
import { FloatingAction } from 'react-native-floating-action';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const navigation = useNavigation();

  const actions = [
    {
      text: 'Centres proches',
      icon: require('./images/ic_location.png'),
      name: 'centres',
      position: 1,
    },
  ];

  const handleFabPress = (name) => {
    if (name === 'centres') {
      navigation.navigate('CentresProches');
    }
  };

  return (
    <View>
      {/* Votre contenu */}
      <FloatingAction
        actions={actions}
        onPressItem={handleFabPress}
        buttonSize={56}
        color={colors.primary}
      />
    </View>
  );
}
```

---

## 📋 Utilisation des utilitaires

### Obtenir la distance

```typescript
import { getDistanceKm, formatDistance } from '../utils/geolocation';

const distance = getDistanceKm(12.345, -8.012, 12.350, -8.015);
console.log(`Distance: ${formatDistance(distance)} km`);
// Output: Distance: 0.6 km
```

### Ouvrir Google Maps

```typescript
import { openGoogleMapsDirections } from '../utils/geolocation';

const handlePress = async () => {
  const success = await openGoogleMapsDirections(12.345, -8.012, 'Centre de Santé');
  if (!success) {
    Alert.alert('Erreur', 'Google Maps n\'est pas disponible');
  }
};
```

### Trier par distance

```typescript
import { sortCentresByDistance } from '../utils/geolocation';

const userLat = 12.345;
const userLon = -8.012;
const centres = [/* données de l'API */];

const centresTries = sortCentresByDistance(centres, userLat, userLon);

centresTries.forEach((centre) => {
  console.log(`${centre.nom}: ${centre.distance.toFixed(1)} km`);
});
```

---

## 🧪 Tester localement

### Setup de test

1. Configurez l'API:
```typescript
// constants/api.js
export const API_BASE_URL = 'http://192.168.1.100:8000/api'; // Votre IP locale
```

2. Lancez le backend Django:
```bash
cd backend_L3
python manage.py runserver 0.0.0.0:8000
```

3. Lancez l'app Expo:
```bash
cd frontEnd/medaclikml
npm start
```

4. Testez sur un device réel (pas sur l'émulateur, pour le GPS) ou utilisez un émulateur avec mock location.

### Mock location pour tests

**Android Emulator:**
- Dans l'émulateur, allez à: `...` (more options) > Extended Controls
- Sous "Location", mettez lat/lon
- La position se mettra à jour dans l'app

**iOS Simulator:**
- Xcode > Simulator > Features > Location > Fremont, CA (ou autre)
- Ou utilisez le fichier GPX

---

## 📱 Vérification de l'écran

L'écran s'affichera comme ceci:

```
┌─────────────────────────────────┐
│ Centres proches                 │  ← Header
│ 3 centres                       │
├─────────────────────────────────┤
│ ℹ️ Appuyez sur un centre...   │  ← Info box
├─────────────────────────────────┤
│ 🏥 Centre A - Bamako            │
│ 📍 Rue X, Quartier Y            │
│ 📍 Bamako                       │
│ 📞 +223 12345678                │
│ 📏 2.3 km de votre position     │  ← Distance
│ ────────────────────────────────│
│ ➜ Ouvrir itinéraire             │  ← Bouton CTA
├─────────────────────────────────┤
│ 🏥 Centre B - Ségou             │
│ 📍 Avenue Z, Quartier A         │
│ 📍 Ségou                        │
│ 📞 +223 87654321                │
│ 📏 15.8 km de votre position    │
│ ────────────────────────────────│
│ ➜ Ouvrir itinéraire             │
├─────────────────────────────────┤
│ 🏥 Centre C - Kayes             │
│ ...
└─────────────────────────────────┘
```

Glissez vers le bas pour actualiser (pull-to-refresh).

---

## ⚠️ Points importants

1. **API_BASE_URL** doit pointer vers votre backend
2. **Permissions** doivent être dans `app.json`
3. **GPS** fonctionne mieux en extérieur et sur device réel
4. **Google Maps** doit être installée (ou accessible via navigateur)
5. **Pas de carte interactive** (comme demandé, on utilise juste le calcul de distance)

Bon développement! 🚀
