import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  Linking,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { getDistanceKm, formatDistance, openGoogleMapsDirections, sortCentresByDistance } from '../utils/geolocation';
import { API_BASE_URL } from '../constants/api';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');

export default function CentresProchesScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [centres, setCentres] = useState([]);
  const [centresTries, setCentresTries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [error, setError] = useState(null);
  const [loadingError, setLoadingError] = useState(null);

  /**
   * Demande la permission de localisation et récupère la position utilisateur
   */
  const getUserLocation = useCallback(async () => {
    try {
      setError(null);

      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationPermission('denied');
        setError('Permission de localisation refusée. Vous ne pouvez pas utiliser cette fonctionnalité.');
        setLoading(false);
        return;
      }

      setLocationPermission('granted');

      // Récupérer la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      console.error('Erreur de localisation:', err);
      setError('Impossible de récupérer votre position. Vérifiez que le GPS est activé.');
      setLoading(false);
    }
  }, []);

  /**
   * Récupère la liste des centres de santé depuis l'API
   */
  const fetchCentres = useCallback(async () => {
    try {
      setLoadingError(null);
      const response = await fetch(`${API_BASE_URL}/centres/`);

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      setCentres(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des centres:', err);
      setLoadingError('Impossible de charger les centres. Vérifiez votre connexion.');
      setCentres([]);
    }
  }, []);

  /**
   * Trie et filtre les centres en fonction de la distance utilisateur
   */
  useEffect(() => {
    if (userLocation && centres.length > 0) {
      const sorted = sortCentresByDistance(
        centres,
        userLocation.latitude,
        userLocation.longitude
      );
      setCentresTries(sorted);
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation, centres]);

  /**
   * Initialise le chargement des données
   */
  useEffect(() => {
    const initialize = async () => {
      await fetchCentres();
      await getUserLocation();
    };

    initialize();
  }, []);

  /**
   * Gère le rafraîchissement manuel
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    setLoadingError(null);

    await Promise.all([fetchCentres(), getUserLocation()]);
  }, [fetchCentres, getUserLocation]);

  /**
   * Ouvre Google Maps pour l'itinéraire vers le centre
   */
  const handleOpenMaps = async (centre) => {
    try {
      await openGoogleMapsDirections(centre.latitude, centre.longitude, centre.nom);
    } catch (err) {
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir Google Maps. Vérifiez que l\'application est installée ou que vous avez une connexion Internet.'
      );
    }
  };

  /**
   * Réessaye de récupérer la localisation
   */
  const handleRetryLocation = () => {
    setError(null);
    setLoading(true);
    getUserLocation();
  };

  /**
   * Composant pour afficher une carte de centre
   */
  const CentreCard = ({ item }) => {
    const distance = item.distance ? formatDistance(item.distance) : null;

    return (
      <TouchableOpacity
        style={styles.centreCard}
        onPress={() => handleOpenMaps(item)}
        activeOpacity={0.8}
      >
        <View style={styles.centreCardContent}>
          <View style={styles.centreHeader}>
            <MaterialIcons name="local-hospital" size={24} color={theme.colors.primary} />
            <Text style={styles.centreName} numberOfLines={1}>
              {item.nom}
            </Text>
          </View>

          <View style={styles.centreDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={16} color={theme.colors.secondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.adresse}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="place" size={16} color={theme.colors.secondary} />
              <Text style={styles.detailText}>{item.ville}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={16} color={theme.colors.secondary} />
              <Text style={styles.detailText}>{item.telephone}</Text>
            </View>

            {distance && (
              <View style={styles.distanceRow}>
                <MaterialIcons name="distance" size={16} color={theme.colors.accent} />
                <Text style={styles.distanceText}>
                  {distance} km de votre position
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionButton}>
            <MaterialIcons name="directions" size={20} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Ouvrir itinéraire</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Composant pour afficher le message d'erreur de permission
   */
  const PermissionDeniedView = () => (
    <View style={styles.centerContainer}>
      <MaterialIcons name="location-off" size={60} color={theme.colors.secondary} />
      <Text style={styles.errorTitle}>Localisation désactivée</Text>
      <Text style={styles.errorMessage}>
        Nous avons besoin de l'accès à votre position pour afficher les centres proches.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetryLocation}>
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => {
          Linking.openSettings();
        }}
      >
        <Text style={styles.settingsButtonText}>Ouvrir les paramètres</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Composant pour afficher le message d'erreur de chargement
   */
  const ErrorView = () => (
    <View style={styles.centerContainer}>
      <MaterialIcons name="error-outline" size={60} color={theme.colors.secondary} />
      <Text style={styles.errorTitle}>{error || loadingError}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Composant pour afficher le message "Aucun centre trouvé"
   */
  const EmptyView = () => (
    <View style={styles.centerContainer}>
      <MaterialIcons name="store-mall-directory" size={60} color={theme.colors.secondary} />
      <Text style={styles.emptyTitle}>Aucun centre trouvé</Text>
      <Text style={styles.emptyMessage}>
        Aucun centre de santé n'a été géolocalisé. Vérifiez que les coordonnées GPS sont disponibles.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  // Vue de chargement
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Récupération de votre position...</Text>
      </View>
    );
  }

  // Vue d'erreur de permission
  if (locationPermission === 'denied') {
    return <PermissionDeniedView />;
  }

  // Vue d'erreur générale
  if (error || loadingError) {
    return <ErrorView />;
  }

  // Vue vide
  if (centresTries.length === 0) {
    return <EmptyView />;
  }

  // Vue principale
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Centres proches</Text>
        <Text style={styles.headerSubtitle}>
          {centresTries.length} centre{centresTries.length > 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={centresTries}
        renderItem={({ item }) => <CentreCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Appuyez sur un centre pour voir l'itinéraire sur Google Maps
            </Text>
          </View>
        }
        scrollIndicatorInsets={{ right: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  centreCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  centreCardContent: {
    padding: 16,
  },
  centreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  centreName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: 12,
  },
  centreDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.secondary,
    marginLeft: 12,
    lineHeight: 18,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent,
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  settingsButton: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
