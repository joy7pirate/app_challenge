# app.json - Configuration des Permissions de Localisation

Ajoutez cette section au fichier `app.json` de votre projet Expo pour configurer les permissions de localisation.

## 📋 Configuration complète

```json
{
  "expo": {
    "name": "medaclikml",
    "slug": "medaclikml",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.medaclikml.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Nous avons besoin de votre localisation pour vous montrer les centres de santé les plus proches.",
        "NSLocationAlwaysUsageDescription": "Nous utilisons votre localisation pour vous proposer les centres proches.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Nous utilisons votre localisation pour vous proposer les centres proches."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.medaclikml.app",
      "permissions": [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "scheme": "medaclikml",
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Nous avons besoin de votre localisation pour vous montrer les centres de santé les plus proches.",
          "locationWhenInUsePermission": "Nous avons besoin de votre localisation pour vous montrer les centres de santé les plus proches."
        }
      ]
    ]
  }
}
```

## 🔑 Explications des clés

### Android
- **permissions**: Array de permissions Android natives
  - `ACCESS_FINE_LOCATION`: GPS précis
  - `ACCESS_COARSE_LOCATION`: GPS approximatif

### iOS (infoPlist)
- **NSLocationWhenInUseUsageDescription**: Message quand l'app est en utilisation
- **NSLocationAlwaysUsageDescription**: Message pour localisation permanente
- **NSLocationAlwaysAndWhenInUseUsageDescription**: Message pour les deux cas

### Expo Plugin
- **locationWhenInUsePermission**: Texte du pop-up lors de la demande de permission
- **locationAlwaysAndWhenInUsePermission**: Texte pour l'option "Toujours"

## 🧪 Test

Après configuration, testez avec:

```bash
# Rebuilder l'app
eas build --platform android --local
# ou
eas build --platform ios --local

# Ou simplement relancer en dev
npm start
```

Au premier lancement de l'écran `CentresProchesScreen`, l'utilisateur verra un pop-up de demande de permission.

## ✅ Vérifications

### Android
1. Allez dans Paramètres > Permissions > Localisation
2. Vérifiez que MedaCliK a la permission "Localisation"

### iOS
1. Allez dans Paramètres > Confidentialité > Services de localisation
2. Vérifiez que MedaCliK est listé et autorisé
