import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, ImageBackground, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import API_ENDPOINTS, { api } from '../../config/api';

export default function MedecinProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch Profile ────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/LoginScreen');
        return;
      }

      const res = await api.get(API_ENDPOINTS.AUTH.ME);
      setProfile(res.data);
      console.log('Profil médecin:', res.data);

      // Fetch centres if medecin_id exists
      if (res.data.medecin_id) {
        const centresRes = await api.get(API_ENDPOINTS.CENTRES.LIST, {
          params: { medecin: res.data.medecin_id }
        });
        setCentres(centresRes.data || []);
      }
    } catch (error) {
      console.log('Erreur fetch profile:', error?.response?.data || error.message);

      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'role']);
        router.replace('/LoginScreen');
        return;
      }

      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'role']);
            router.replace('/LoginScreen');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Section */}
      <ImageBackground
        source={{ uri: 'https://via.placeholder.com/400x200/2563eb/ffffff?text=Médecin' }}
        style={styles.headerBackground}
      >
        <View style={styles.headerOverlay}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {profile?.first_name?.[0]?.toUpperCase()}{profile?.last_name?.[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.doctorName}>
            Dr. {profile?.first_name} {profile?.last_name}
          </Text>
          <Text style={styles.specialty}>{profile?.specialite}</Text>
        </View>
      </ImageBackground>

      {/* Info Cards */}
      <View style={styles.section}>
        {/* Email */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="mail-outline" size={24} color="#2563eb" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.username || 'N/A'}</Text>
          </View>
        </View>

        {/* Phone */}
        {profile?.telephone && (
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={24} color="#2563eb" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{profile.telephone}</Text>
            </View>
          </View>
        )}

        {/* License */}
        {profile?.numero_licence && (
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="document-outline" size={24} color="#2563eb" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Numéro de licence</Text>
              <Text style={styles.infoValue}>{profile.numero_licence}</Text>
            </View>
          </View>
        )}

        {/* Specialty */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="medical-outline" size={24} color="#2563eb" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Spécialité</Text>
            <Text style={styles.infoValue}>{profile?.specialite || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Centres */}
      {centres.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centres de travail</Text>
          {centres.map((centre, idx) => (
            <View key={idx} style={styles.centreCard}>
              <View style={styles.centreHeader}>
               <FontAwesome name="hospital-o" size={24} color="#059669" />
                <Text style={styles.centreName}>{centre.nom}</Text>
              </View>
              <Text style={styles.centreDetail}>
                <Entypo name="location-pin" size={20} color="#2563eb" />
                 {centre.adresse}</Text>
              <Text style={styles.centreDetail}>
                <MaterialCommunityIcons name="city-variant-outline" size={18} color="#2563eb" />
                 {centre.ville}</Text>
              {centre.telephone && (
                <Text style={styles.centreDetail}>
                  <Feather name="phone" size={18} color="#2563eb" />
                   {centre.telephone}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => router.push('/medecinPages/horaire')}
        >
          <Ionicons name="calendar-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Gérer mes horaires</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => router.push('/medecinPages/appointments')}
        >
          <Ionicons name="clipboard-outline" size={20} color="#2563eb" />
          <Text style={styles.buttonSecondaryText}>Mes rendez-vous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonDanger}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerBackground: {
    height: 240,
    backgroundColor: '#2563eb',
  },
  headerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  specialty: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 8,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    marginRight: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginTop: 4,
  },
  centreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  centreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  centreName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginLeft: 12,
    flex: 1,
  },
  centreDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  buttonDanger: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginLeft: 12,
  },
});