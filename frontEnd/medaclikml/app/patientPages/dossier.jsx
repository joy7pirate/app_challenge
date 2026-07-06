import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.100.81:8000/api';

export default function DossierMedicalScreen() {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          setError('Aucun token d’authentification trouvé.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/patient/dossier/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setDossier(response.data);
      } catch (err) {
        console.error('Erreur dossier médical :', err);
        setError('Impossible de charger le dossier médical.');
      } finally {
        setLoading(false);
      }
    };

    fetchDossier();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.infoText}>Chargement du dossier…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!dossier) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Aucun dossier médical disponible.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Dossier médical</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations générales</Text>
        <Text style={styles.label}>Groupe sanguin : {dossier.groupe_sanguin || 'Non renseigné'}</Text>
        <Text style={styles.label}>Allergies : {dossier.allergies || 'Aucune'}</Text>
        <Text style={styles.label}>Antécédents : {dossier.antecedents || 'Aucun'}</Text>
        <Text style={styles.label}>Maladies chroniques : {dossier.maladies_chroniques || 'Aucune'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Consultations</Text>
        {dossier.consultations?.length ? (
          dossier.consultations.map((consultation) => (
            <View key={consultation.id} style={styles.itemBox}>
              <Text style={styles.itemTitle}>{consultation.motif || 'Consultation'}</Text>
              <Text style={styles.itemText}>Date : {consultation.date ? new Date(consultation.date).toLocaleString('fr-FR') : 'Non renseignée'}</Text>
              <Text style={styles.itemText}>Médecin : {consultation.medecin_detail ? `${consultation.medecin_detail.prenom} ${consultation.medecin_detail.nom}` : 'Non renseigné'}</Text>
              <Text style={styles.itemText}>Diagnostic : {consultation.diagnostic || 'Non renseigné'}</Text>
              <Text style={styles.itemText}>Traitement : {consultation.traitement || 'Non renseigné'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune consultation enregistrée.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ordonnances</Text>
        {dossier.consultations?.some((c) => c.ordonnance_detail) ? (
          dossier.consultations.map((consultation) =>
            consultation.ordonnance_detail ? (
              <View key={consultation.ordonnance_detail.id} style={styles.itemBox}>
                <Text style={styles.itemTitle}>Ordonnance</Text>
                <Text style={styles.itemText}>Médicaments : {consultation.ordonnance_detail.medicaments}</Text>
                <Text style={styles.itemText}>Durée : {consultation.ordonnance_detail.duree || 'Non renseignée'}</Text>
                <Text style={styles.itemText}>Instructions : {consultation.ordonnance_detail.instructions || 'Aucune'}</Text>
              </View>
            ) : null
          )
        ) : (
          <Text style={styles.emptyText}>Aucune ordonnance disponible.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Examens</Text>
        {dossier.examens?.length ? (
          dossier.examens.map((examen) => (
            <View key={examen.id} style={styles.itemBox}>
              <Text style={styles.itemTitle}>{examen.type_examen}</Text>
              <Text style={styles.itemText}>Description : {examen.description || 'Non renseignée'}</Text>
              <Text style={styles.itemText}>Résultat : {examen.resultat || 'En attente'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucun examen enregistré.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1d4ed8',
  },
  label: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
  },
  itemBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#f8fafc',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  infoText: {
    marginTop: 12,
    color: '#475569',
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
  },
});
