// app/patientPages/profilePatient.jsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'http://192.168.100.81:8000/api';

export default function ProfilePatient() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [dateNaissance, setDateNaissance] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getToken = async () => await AsyncStorage.getItem('access_token');

  const fetchPatient = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/patients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      setPatient(data);
      setTelephone(data.telephone || '');
      setAdresse(data.adresse || '');
      if (data.date_naissance) {
        setDateNaissance(new Date(data.date_naissance));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger votre profil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatient();
  }, [fetchPatient]);

  const calculerAge = (dateStr) => {
    if (!dateStr) return '-';
    const naissance = new Date(dateStr);
    const aujourdHui = new Date();
    let age = aujourdHui.getFullYear() - naissance.getFullYear();
    const mois = aujourdHui.getMonth() - naissance.getMonth();
    if (mois < 0 || (mois === 0 && aujourdHui.getDate() < naissance.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Non renseignée';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

const handleSave = async () => {
  setSaving(true);
  try {
    const token = await getToken();
    await axios.patch(
      `${API_URL}/patients/${patient.id}/`,
      {
        telephone,
        adresse,
        date_naissance: dateNaissance.toISOString().split('T')[0],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    Alert.alert('Succès', 'Profil mis à jour !');
    setEditMode(false);
    fetchPatient();
  } catch (error) {
    console.error(error);
    Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
  } finally {
    setSaving(false);
  }
};

  const handleCancel = () => {
    setTelephone(patient.telephone || '');
    setAdresse(patient.adresse || '');
    if (patient.date_naissance) {
      setDateNaissance(new Date(patient.date_naissance));
    }
    setEditMode(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateNaissance(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E86DE" />
        <Text style={styles.loadingText}>Chargement de votre profil...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Profil introuvable</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPatient}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initiales = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E86DE']} />
        }
      >
        {/* Header avec avatar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initiales}</Text>
            </View>
          </View>

          <Text style={styles.patientName}>
            {patient.first_name} {patient.last_name}
          </Text>
          <Text style={styles.patientEmail}>{patient.email}</Text>

          <View style={styles.badgeAge}>
            <MaterialCommunityIcons name="cake-variant-outline" size={14} color="#2E86DE" />
            <Text style={styles.badgeAgeText}>{calculerAge(patient.date_naissance)} ans</Text>
          </View>
        </View>

        {/* Carte d'informations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            {!editMode ? (
              <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editButton}>
                <Ionicons name="create-outline" size={18} color="#2E86DE" />
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Ionicons name="close" size={18} color="#e74c3c" />
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Prénom / Nom (non modifiables) */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <FontAwesome5 name="user" size={16} color="#2E86DE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nom complet</Text>
              <Text style={styles.infoValue}>
                {patient.first_name} {patient.last_name}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="mail-outline" size={18} color="#2E86DE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{patient.email}</Text>
            </View>
          </View>

          {/* Téléphone */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="call-outline" size={18} color="#2E86DE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={telephone}
                  onChangeText={setTelephone}
                  placeholder="Ex: 06 12 34 56 78"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{patient.telephone || 'Non renseigné'}</Text>
              )}
            </View>
          </View>

          {/* Date de naissance */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <MaterialCommunityIcons name="cake-variant-outline" size={18} color="#2E86DE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date de naissance</Text>
              {editMode ? (
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateInputText}>{formatDate(dateNaissance)}</Text>
                  <Ionicons name="calendar-outline" size={18} color="#2E86DE" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.infoValue}>{formatDate(patient.date_naissance)}</Text>
              )}
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateNaissance}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {/* Adresse */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="location-outline" size={18} color="#2E86DE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Adresse</Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, { minHeight: 60 }]}
                  value={adresse}
                  onChangeText={setAdresse}
                  placeholder="Votre adresse complète"
                  multiline
                />
              ) : (
                <Text style={styles.infoValue}>{patient.adresse || 'Non renseignée'}</Text>
              )}
            </View>
          </View>

          {editMode && (
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/patientPages/mesRendezVous')}
          >
            <View style={[styles.infoIconContainer, { backgroundColor: '#e8f4fd' }]}>
              <Ionicons name="calendar-outline" size={18} color="#2E86DE" />
            </View>
            <Text style={styles.actionText}>Mes rendez-vous</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/patientPages/mesDocuments')}
          >
            <View style={[styles.infoIconContainer, { backgroundColor: '#e8f4fd' }]}>
              <Ionicons name="document-text-outline" size={18} color="#2E86DE" />
            </View>
            <Text style={styles.actionText}>Mes documents médicaux</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/patientPages/changerMotDePasse')}
          >
            <View style={[styles.infoIconContainer, { backgroundColor: '#e8f4fd' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#2E86DE" />
            </View>
            <Text style={styles.actionText}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2E86DE',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#2E86DE',
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E86DE',
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  patientEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  badgeAge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
    gap: 4,
  },
  badgeAgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E86DE',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    color: '#2E86DE',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  dateInputText: {
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E86DE',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fce4e4',
    gap: 8,
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});
