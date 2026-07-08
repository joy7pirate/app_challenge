import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const API_URL = 'http://192.168.100.81:8000/api';

const STATUT_CONFIG = {
  en_attente: { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7' },
  confirme: { label: 'Confirmé', color: '#10B981', bg: '#D1FAE5' },
  reporte: { label: 'Reporté', color: '#3B82F6', bg: '#DBEAFE' },
  termine: { label: 'Terminé', color: '#6B7280', bg: '#F3F4F6' },
  annule: { label: 'Annulé', color: '#EF4444', bg: '#FEE2E2' },
};

const FILTERS = [
  { key: 'tous', label: 'Tous' },
  { key: 'avenir', label: 'À venir' },
  { key: 'passes', label: 'Passés' },
];

export default function MesRendezVous() {
  const router = useRouter();
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('tous');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [processingReponse, setProcessingReponse] = useState(false);

  const getToken = async () => {
    return await AsyncStorage.getItem('access_token');
  };

  const fetchRdvs = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/rendezvous/patient/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRdvs(res.data);
    } catch (error) {
      console.log(error?.response?.data || error.message);
      Alert.alert('Erreur', "Impossible de charger vos rendez-vous.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRdvs();
  }, [fetchRdvs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRdvs();
  };

  const getFilteredRdvs = () => {
    const now = new Date();
    if (filter === 'avenir') {
      return rdvs.filter((r) => new Date(`${r.jour}T${r.heure}`) >= now);
    }
    if (filter === 'passes') {
      return rdvs.filter((r) => new Date(`${r.jour}T${r.heure}`) < now);
    }
    return rdvs;
  };

  const openModal = (rdv) => {
    setSelectedRdv(rdv);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRdv(null);
  };

  const repondreContreProposition = async (reponse) => {
    if (!selectedRdv) return;
    setProcessingReponse(true);
    try {
      const token = await getToken();
      await axios.patch(
        `${API_URL}/rendezvous/${selectedRdv.id}/repondre/`,
        { reponse },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        'Succès',
        reponse === 'accepter'
          ? 'Vous avez accepté la nouvelle proposition.'
          : 'Vous avez refusé la proposition. Le rendez-vous est annulé.'
      );
      closeModal();
      fetchRdvs();
    } catch (error) {
      console.log(error?.response?.data || error.message);
      Alert.alert('Erreur', "Impossible d'envoyer votre réponse.");
    } finally {
      setProcessingReponse(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatHeure = (heureStr) => {
    if (!heureStr) return '';
    return heureStr.slice(0, 5);
  };

  const renderCard = ({ item }) => {
    const statutInfo = STATUT_CONFIG[item.statut] || STATUT_CONFIG.en_attente;
    const hasProposition = !!item.nouveau_jour && !!item.nouvelle_heure;

    return (
      <View style={[styles.card, hasProposition && styles.cardHighlight]}>
        <View style={styles.cardHeader}>
          <View style={styles.medecinInfo}>
            <View style={styles.avatarCircle}>
              <FontAwesome5 name="user-md" size={18} color="#2563EB" />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.medecinNom}>
                Dr {item.medecin_prenom} {item.medecin_nom}
              </Text>
              <Text style={styles.specialite}>{item.medecin_specialite}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: statutInfo.bg }]}>
            <Text style={[styles.badgeText, { color: statutInfo.color }]}>
              {statutInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{formatDate(item.jour)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{formatHeure(item.heure)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{item.centre_nom || 'Centre non spécifié'}</Text>
        </View>
        {item.motif ? (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="text-box-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{item.motif}</Text>
          </View>
        ) : null}

        {hasProposition && (
          <View style={styles.propositionBox}>
            <View style={styles.propositionHeader}>
              <MaterialCommunityIcons name="calendar-sync" size={18} color="#2563EB" />
              <Text style={styles.propositionTitle}>Nouvelle proposition du médecin</Text>
            </View>
            <TouchableOpacity style={styles.repondreBtn} onPress={() => openModal(item)}>
              <Text style={styles.repondreBtnText}>Répondre</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes rendez-vous</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={getFilteredRdvs()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons name="calendar-remove" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucun rendez-vous trouvé</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contre-proposition</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.comparisonBox}>
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonLabel}>Ancien créneau</Text>
                  <View style={styles.comparisonCard}>
                    <Ionicons name="calendar-outline" size={18} color="#EF4444" />
                    <Text style={styles.comparisonDate}>
                      {selectedRdv && formatDate(selectedRdv.jour)}
                    </Text>
                    <Text style={styles.comparisonHeure}>
                      {selectedRdv && formatHeure(selectedRdv.heure)}
                    </Text>
                  </View>
                </View>

                <Ionicons name="arrow-forward" size={20} color="#9CA3AF" style={{ marginHorizontal: 8 }} />

                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonLabel}>Nouveau créneau</Text>
                  <View style={[styles.comparisonCard, styles.comparisonCardNew]}>
                    <Ionicons name="calendar" size={18} color="#10B981" />
                    <Text style={styles.comparisonDate}>
                      {selectedRdv && formatDate(selectedRdv.nouveau_jour)}
                    </Text>
                    <Text style={styles.comparisonHeure}>
                      {selectedRdv && formatHeure(selectedRdv.nouvelle_heure)}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedRdv?.commentaire_medecin ? (
                <View style={styles.commentBox}>
                  <Text style={styles.commentLabel}>Commentaire du médecin :</Text>
                  <Text style={styles.commentText}>{selectedRdv.commentaire_medecin}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.refuseBtn]}
                onPress={() => repondreContreProposition('refuser')}
                disabled={processingReponse}
              >
                {processingReponse ? (
                  <ActivityIndicator color="#EF4444" size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                    <Text style={styles.refuseBtnText}>Refuser</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.accepteBtn]}
                onPress={() => repondreContreProposition('accepter')}
                disabled={processingReponse}
              >
                {processingReponse ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.accepteBtnText}>Accepter</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, color: '#9CA3AF', fontSize: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHighlight: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medecinInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medecinNom: { fontSize: 15, fontWeight: '700', color: '#111827' },
  specialite: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  infoText: { fontSize: 13, color: '#374151', flex: 1 },

  propositionBox: {
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
  },
  propositionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  propositionTitle: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  repondreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 4,
  },
  repondreBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  comparisonBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  comparisonColumn: { flex: 1 },
  comparisonLabel: { fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: '600' },
  comparisonCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  comparisonCardNew: { backgroundColor: '#ECFDF5' },
  comparisonDate: { fontSize: 12, color: '#111827', marginTop: 6, textAlign: 'center' },
  comparisonHeure: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 4 },

  commentBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  commentLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  commentText: { fontSize: 13, color: '#374151', lineHeight: 18 },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  refuseBtn: { backgroundColor: '#FEE2E2' },
  refuseBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  accepteBtn: { backgroundColor: '#10B981' },
  accepteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
