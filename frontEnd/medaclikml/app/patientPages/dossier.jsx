import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../config/api'; // ✅ Utilise la nouvelle API

export default function DossierMedicalScreen() {
  const { patientId } = useLocalSearchParams(); // ✅ Récupère l'ID du patient
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const fetchDossier = async (isRetry = false) => {
    try {
      // ✅ Si c'est pour le patient connecté (pas de patientId)
      let response;
      if (!patientId) {
        response = await apiService.getMyDossier();
      } else {
        // ✅ Si c'est pour un patient spécifique (médecin)
        response = await apiService.getPatientDossier(patientId);
      }

      setDossier(response.data);
      setError('');
      setRetryCount(0);
    } catch (err) {
      console.error('Erreur dossier médical :', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
      });

      // 🔄 Retry automatique avec délai progressif
      if (
        (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) &&
        retryCount < MAX_RETRIES &&
        !isRetry
      ) {
        const delai = 2000 * (retryCount + 1); // 2s, 4s, 6s
        console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} après ${delai}ms...`);
        setRetryCount(retryCount + 1);
        setTimeout(() => fetchDossier(true), delai);
        return;
      }

      // Gestion spécifique des erreurs
      if (err.response?.status === 404) {
        setError('❌ Aucun dossier médical trouvé.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('⏱️ Le serveur met trop de temps à répondre. Vérifiez votre connexion.');
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network')) {
        setError('🔌 Impossible de se connecter au serveur.');
      } else if (err.response?.status === 401) {
        setError('🔐 Session expirée. Redirection vers la connexion...');
        setTimeout(async () => {
          await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
          router.replace('/LoginScreen');
        }, 2000);
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Erreur lors du chargement du dossier.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [patientId]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRetryCount(0);
    fetchDossier();
  };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    setRetryCount(0);
    fetchDossier();
  };

  // 🔄 Écran de chargement
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.infoText}>Chargement du dossier…</Text>
        {retryCount > 0 && (
          <Text style={styles.retryText}>
            Tentative {retryCount}/{MAX_RETRIES}
          </Text>
        )}
      </View>
    );
  }

  // ❌ Écran d'erreur
  if (error) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Text
            style={[styles.infoText, { marginTop: 16, color: '#2563eb', fontWeight: '600' }]}
            onPress={handleRetry}
          >
            🔄 Réessayer
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ⚠️ Aucun dossier
  if (!dossier) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.centered}>
          <Text style={styles.infoText}>📋 Aucun dossier médical disponible.</Text>
          <Text
            style={[styles.infoText, { marginTop: 16, color: '#2563eb', fontWeight: '600' }]}
            onPress={handleRetry}
          >
            🔄 Réessayer
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ✅ Affichage du dossier
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>
        {patientId ? '📋 Dossier du patient' : '📋 Mon dossier médical'}
      </Text>

      {/* 🏥 Informations générales */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations générales</Text>
        <Text style={styles.label}>
          🩸 Groupe sanguin : <Text style={styles.value}>{dossier.groupe_sanguin || 'Non renseigné'}</Text>
        </Text>
        <Text style={styles.label}>
          ⚠️ Allergies : <Text style={styles.value}>{dossier.allergies || 'Aucune'}</Text>
        </Text>
        <Text style={styles.label}>
          📜 Antécédents : <Text style={styles.value}>{dossier.antecedents || 'Aucun'}</Text>
        </Text>
        <Text style={styles.label}>
          🏥 Maladies chroniques : <Text style={styles.value}>{dossier.maladies_chroniques || 'Aucune'}</Text>
        </Text>
      </View>

      {/* 👨‍⚕️ Consultations */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Consultations ({dossier.consultations?.length || 0})</Text>
        {dossier.consultations?.length ? (
          dossier.consultations.map((consultation) => (
            <View key={consultation.id} style={styles.itemBox}>
              <Text style={styles.itemTitle}>
                {consultation.motif || 'Consultation'}
              </Text>
              <Text style={styles.itemText}>
                📅 Date : {consultation.date
                  ? new Date(consultation.date).toLocaleString('fr-FR')
                  : 'Non renseignée'}
              </Text>
              {consultation.medecin_detail && (
                <Text style={styles.itemText}>
                  👨‍⚕️ Médecin : Dr. {consultation.medecin_detail.first_name} {consultation.medecin_detail.last_name}
                </Text>
              )}
              {consultation.diagnostic && (
                <Text style={styles.itemText}>
                  🔍 Diagnostic : {consultation.diagnostic}
                </Text>
              )}
              {consultation.traitement && (
                <Text style={styles.itemText}>
                  💊 Traitement : {consultation.traitement}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune consultation enregistrée.</Text>
        )}
      </View>

      {/* 💊 Ordonnances */}
      {dossier.ordonnances?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ordonnances ({dossier.ordonnances.length})</Text>
          {dossier.ordonnances.map((ordonnance) => (
            <View key={ordonnance.id} style={styles.itemBox}>
              <Text style={styles.itemTitle}>💊 Ordonnance</Text>
              <Text style={styles.itemText}>
                Médicaments : {ordonnance.medicaments}
              </Text>
              <Text style={styles.itemText}>
                Durée : {ordonnance.duree || 'Non renseignée'}
              </Text>
              {ordonnance.instructions && (
                <Text style={styles.itemText}>
                  📝 Instructions : {ordonnance.instructions}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 🧬 Examens */}
      {dossier.examens?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Examens ({dossier.examens.length})</Text>
          {dossier.examens.map((examen) => (
            <View key={examen.id} style={styles.itemBox}>
              <Text style={styles.itemTitle}>🧬 {examen.type_examen}</Text>
              <Text style={styles.itemText}>
                Description : {examen.description || 'N/A'}
              </Text>
              <Text style={[styles.itemText, {
                color: examen.resultat === 'En attente' ? '#f97316' : '#16a34a'
              }]}>
                Résultat : {examen.resultat || 'En attente'}
              </Text>
            </View>
          ))}
        </View>
      )}
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
    minHeight: 400,
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
    marginBottom: 12,
    color: '#1d4ed8',
  },
  label: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
    fontWeight: '500',
  },
  value: {
    color: '#0f172a',
    fontWeight: '600',
  },
  itemBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#f8fafc',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  itemText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 3,
    lineHeight: 18,
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: 14,
  },
  infoText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 16,
  },
  retryText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});