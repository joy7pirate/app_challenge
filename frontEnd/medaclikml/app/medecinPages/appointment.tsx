// app/medecinPages/appointments.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, ScrollView,
  Modal, Platform, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import API_ENDPOINTS, { api } from '../../config/api';

const STATUT_STYLE = {
  en_attente: { bg: '#FFF3E0', text: '#FF9800', label: 'EN ATTENTE' },
  confirme:   { bg: '#E8F5E9', text: '#4CAF50', label: 'CONFIRME'    },
  accepte:    { bg: '#E8F5E9', text: '#4CAF50', label: 'ACCEPTÉ'    },
  reporte:    { bg: '#E3F2FD', text: '#2196F3', label: 'REPORTÉ'    },
  refuse:     { bg: '#FFEBEE', text: '#F44336', label: 'REFUSÉ'     },
  termine:    { bg: '#F3E5F5', text: '#9C27B0', label: 'TERMINÉ'    },
  annule:     { bg: '#FFEBEE', text: '#F44336', label: 'ANNULE'      },
};

const FILTRES = [
  { key: 'all',        label: 'Tous',       color: '#607D8B' },
  { key: 'en_attente', label: 'En attente', color: '#FF9800' },
  { key: 'accepte',    label: 'Accepté',    color: '#4CAF50' },
  { key: 'reporte',    label: 'Reporté',    color: '#2196F3' },
  { key: 'refuse',     label: 'Refusé',     color: '#F44336' },
  { key: 'termine',    label: 'Terminé',    color: '#9C27B0' },
];

const normalizeStatut = (statut) => {
  if (statut === 'confirme') return 'accepte';
  if (statut === 'annule') return 'refuse';
  return statut;
};

const getRdvDateTime = (rdv) => {
  if (!rdv?.jour) return null;

  const [year, month, day] = String(rdv.jour).split('-').map(Number);
  if (!year || !month || !day) return null;

  const [hour = 0, minute = 0, second = 0] = String(rdv.heure || '00:00:00')
    .split(':')
    .map(Number);

  return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
};

const isRdvReadyToFinish = (rdv, now) => {
  const rdvDateTime = getRdvDateTime(rdv);
  return normalizeStatut(rdv.statut) === 'accepte' && rdvDateTime !== null && rdvDateTime <= now;
};

export default function AppointmentsScreen() {
  const [rdvs, setRdvs]               = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState('');
  const [activeStatut, setActiveStatut] = useState('all');
  const [thisWeek, setThisWeek]       = useState(false);
  const [now, setNow]                 = useState(new Date());
  const [counts, setCounts]           = useState({
    en_attente: 0, accepte: 0, reporte: 0, refuse: 0, termine: 0
  });

  // ── Modal Reporter ─────────────────────────────────────────────────────────
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [rdvToReport, setRdvToReport]     = useState(null);
  const [nouveauJour, setNouveauJour]     = useState(new Date());
  const [nouvelleHeure, setNouvelleHeure] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [commentaire, setCommentaire]     = useState('');
  const [submitting, setSubmitting]       = useState(false);

  // ── Fetch RDVs ─────────────────────────────────────────────────────────────
  const fetchRdvs = useCallback(async () => {
    try {
      // ✅ L'intercepteur ajoute automatiquement le token
      const res = await api.get(API_ENDPOINTS.RENDEZVOUS.MEDECIN_LIST);
      const data = res.data;
      setRdvs(data);

      const c = { en_attente: 0, accepte: 0, reporte: 0, refuse: 0, termine: 0 };
      data.forEach(r => {
        const statut = normalizeStatut(r.statut);
        if (c[statut] !== undefined) c[statut]++;
      });
      setCounts(c);
    } catch (e) {
      console.log('ERREUR fetchRdvs:', e?.response?.data || e.message);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRdvs(); }, [fetchRdvs]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Filtrage ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...rdvs];

    if (activeStatut !== 'all') {
      result = result.filter(r => normalizeStatut(r.statut) === activeStatut);
    }

    if (thisWeek) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => {
        const d = new Date(r.jour);
        return d >= start && d <= end;
      });
    }

    if (search.trim()) {
      result = result.filter(r =>
        (`${r.patient_detail?.first_name || ''} ${r.patient_detail?.last_name || ''}`)
          .toLowerCase().includes(search.toLowerCase()) ||
        r.motif?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(result);
  }, [rdvs, activeStatut, thisWeek, search]);

  // ── Update Statut ──────────────────────────────────────────────────────────
  const updateStatut = async (id, statut) => {
    try {
      await api.patch(API_ENDPOINTS.RENDEZVOUS.CHANGE_STATUS(id), { statut });
      await fetchRdvs();
    } catch (e) {
      console.log('ERREUR updateStatut:', e?.response?.data || e.message);
      Alert.alert('Erreur', 'Action impossible');
    }
  };

  const confirmerAction = (id, statut, nom) => {
    const messages = {
      accepte: { titre: 'Accepter', msg: `Accepter le RDV de ${nom} ?` },
      refuse:  { titre: 'Refuser',  msg: `Refuser le RDV de ${nom} ?`  },
      termine: { titre: 'Terminer', msg: `Marquer le RDV de ${nom} comme terminé ?` },
    };
    const m = messages[statut];
    Alert.alert(m.titre, m.msg, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: () => updateStatut(id, statut) },
    ]);
  };

  // ── Reporter un RDV ──────────────────────────────────────────────────────────
  const openReportModal = (rdv) => {
    setRdvToReport(rdv);
    setNouveauJour(new Date());
    setNouvelleHeure(new Date());
    setCommentaire('');
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setRdvToReport(null);
  };

  const submitReport = async () => {
    if (!rdvToReport) return;

    setSubmitting(true);
    try {
      const jourStr  = nouveauJour.toISOString().split('T')[0];
      const heureStr = nouvelleHeure.toTimeString().slice(0, 5);

      await api.patch(API_ENDPOINTS.RENDEZVOUS.CHANGE_STATUS(rdvToReport.id), {
        statut: 'reporte',
        nouveau_jour: jourStr,
        nouvelle_heure: heureStr,
        commentaire_medecin: commentaire,
      });

      Alert.alert('Succès', 'Le rendez-vous a été reporté. Le patient doit confirmer.');
      closeReportModal();
      await fetchRdvs();
    } catch (e) {
      console.log('ERREUR submitReport:', e?.response?.data || e.message);
      Alert.alert('Erreur', "Impossible de reporter ce rendez-vous.");
    } finally {
      setSubmitting(false);
    }
  };



  // ── Render Card ────────────────────────────────────────────────────────────
const renderCard = ({ item }) => {
  const normalizedStatut = normalizeStatut(item.statut);
  const s = STATUT_STYLE[item.statut] || STATUT_STYLE[normalizedStatut] || STATUT_STYLE.en_attente;
  const nom = `${item.patient_detail?.first_name || ''} ${item.patient_detail?.last_name || ''}`.trim() || 'Patient';
  const date = new Date(item.jour).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const heure = item.heure?.slice(0, 5);
  const canFinish = isRdvReadyToFinish(item, now);

  // DEBUG - à retirer après test
  console.log('DEBUG', item.id, 'statut_brut:', item.statut, 'normalise:', normalizedStatut, 'canFinish:', canFinish);

  const initiale = (() => {
    const first = item.patient_detail?.first_name?.trim();
    const last  = item.patient_detail?.last_name?.trim();
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first[0].toUpperCase();
    if (last)  return last[0].toUpperCase();
    return 'P';
  })();

  return (
    <View style={styles.card}>
      {/* Header inchangé */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initiale}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{nom}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color="#888" />
            <Text style={styles.dateText}> {date}</Text>
            <Ionicons name="time-outline" size={13} color="#888" style={{ marginLeft: 8 }} />
            <Text style={styles.dateText}> {heure}</Text>
          </View>
          <Text style={styles.motif} numberOfLines={1}>📋 {item.motif}</Text>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
          </View>
        </View>
      </View>

      {/* ── Boutons EN ATTENTE ── */}
      {normalizedStatut === 'en_attente' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#5CE9FE', flex: 1 }]}
            onPress={() => confirmerAction(item.id, 'accepte', nom)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#006773" />
            <Text style={[styles.btnText, { color: '#006773' }]}>Accepter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#FFDAD6', flex: 1 }]}
            onPress={() => confirmerAction(item.id, 'refuse', nom)}
          >
            <Ionicons name="close-circle" size={16} color="#93000A" />
            <Text style={[styles.btnText, { color: '#93000A' }]}>Refuser</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#F5F5F5', flex: 1 }]}
            onPress={() => openReportModal(item)}
          >
            <Ionicons name="calendar" size={16} color="#555" />
            <Text style={[styles.btnText, { color: '#555' }]}>Reporter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Boutons ACCEPTÉ ── */}
      {normalizedStatut === 'accepte' && (
        <View style={styles.actions}>
          {canFinish ? (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#2196F3', flex: 1 }]}
              onPress={() => confirmerAction(item.id, 'termine', nom)}
            >
              <Ionicons name="checkmark-done-circle" size={16} color="#fff" />
              <Text style={styles.btnText}>Marquer Terminé</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.btn, { backgroundColor: '#E3F2FD', flex: 1 }]}>
              <Ionicons name="hourglass-outline" size={16} color="#2196F3" />
              <Text style={[styles.btnText, { color: '#2196F3' }]}>
                RDV le {date}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#F5F5F5' }]}
            onPress={() => openReportModal(item)}
          >
            <Ionicons name="calendar" size={16} color="#555" />
            <Text style={[styles.btnText, { color: '#555' }]}>Reporter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnIcon}
            onPress={() =>
              Alert.alert(
                nom,
                `📋 Motif : ${item.motif}\n📅 Date : ${date}\n⏰ Heure : ${heure}`
              )
            }
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#555" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── REPORTÉ ── */}
      {normalizedStatut === 'reporte' && (
        <View style={styles.reportInfo}>
          <Ionicons name="information-circle" size={16} color="#2196F3" />
          <Text style={styles.reportInfoText}>
            En attente de confirmation du patient pour le{' '}
            {item.nouveau_jour
              ? new Date(item.nouveau_jour).toLocaleDateString('fr-FR')
              : ''}{' '}
            à {item.nouvelle_heure?.slice(0, 5)}
          </Text>
        </View>
      )}

      {/* ── REFUSÉ / TERMINÉ ── */}
      {(normalizedStatut === 'refuse' || normalizedStatut === 'termine') && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#F5F5F5', marginTop: 12 }]}
          onPress={() =>
            Alert.alert(
              nom,
              `📋 Motif : ${item.motif}\n📅 Date : ${date}\n⏰ Heure : ${heure}`
            )
          }
        >
          <Ionicons name="eye-outline" size={16} color="#555" />
          <Text style={[styles.btnText, { color: '#555' }]}>Voir détails</Text>
        </TouchableOpacity>
      )}

      {/* ── Bouton Dossier Médical ── */}
      <TouchableOpacity
        style={styles.dossierBtn}
        onPress={() => {
          const patientId = item.patient_detail?.id ?? item.patient?.id ?? item.patient_id ?? item.id;
          router.push({
            pathname: '/medecinPages/dossierPatient',
            params: { patientId, rdvId: item.id },
          });
        }}
      >
        <Ionicons name="folder-open-outline" size={16} color="#2563eb" />
        <Text style={styles.dossierBtnText}>Dossier médical</Text>
      </TouchableOpacity>

    </View>
  );
};
  // ── Stats Cards ────────────────────────────────────────────────────────────
  const StatsCard = ({ label, count, icon, color, statut }) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        activeStatut === statut && { borderWidth: 2, borderColor: color }
      ]}
      onPress={() => setActiveStatut(activeStatut === statut ? 'all' : statut)}
    >
      <Ionicons name={icon} size={26} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
    </TouchableOpacity>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rendez-vous</Text>
        <Text style={styles.headerSub}>Gérez vos rendez-vous patients</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchRdvs(); }}
            colors={['#2196F3']}
          />
        }
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatsCard label="En attente" count={counts.en_attente} icon="time"                   color="#FF9800" statut="en_attente" />
              <StatsCard label="Acceptés"   count={counts.accepte}    icon="checkmark-circle"        color="#4CAF50" statut="accepte"    />
              <StatsCard label="Reportés"   count={counts.reporte}    icon="calendar"                 color="#2196F3" statut="reporte"    />
              <StatsCard label="Refusés"    count={counts.refuse}     icon="close-circle"            color="#F44336" statut="refuse"     />
              <StatsCard label="Terminés"   count={counts.termine}    icon="checkmark-done-circle"   color="#9C27B0" statut="termine"    />
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#aaa" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un patient..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#bbb"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close" size={18} color="#aaa" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filtres */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ paddingHorizontal: 12, marginBottom: 8 }}
            >
              <TouchableOpacity
                style={[styles.filterBtn, thisWeek && styles.filterBtnActive]}
                onPress={() => setThisWeek(!thisWeek)}
              >
                <Ionicons name="calendar" size={14} color={thisWeek ? '#2196F3' : '#555'} />
                <Text style={[styles.filterText, thisWeek && { color: '#2196F3' }]}>
                  Cette semaine
                </Text>
              </TouchableOpacity>

              {FILTRES.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterBtn,
                    activeStatut === f.key && { borderColor: f.color, backgroundColor: f.color + '15' }
                  ]}
                  onPress={() => setActiveStatut(f.key)}
                >
                  <Text style={[
                    styles.filterText,
                    activeStatut === f.key && { color: f.color, fontWeight: '600' }
                  ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Compteur */}
            <Text style={styles.resultCount}>
              {filtered.length} rendez-vous trouvé{filtered.length > 1 ? 's' : ''}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>Aucun rendez-vous</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      {/* ── Modal Reporter ── */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReportModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reporter le rendez-vous</Text>
              <TouchableOpacity onPress={closeReportModal}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {rdvToReport && (
              <Text style={styles.modalSubtitle}>
                Patient : {`${rdvToReport.patient_detail?.first_name || ''} ${rdvToReport.patient_detail?.last_name || ''}`.trim() || 'Patient'}
              </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Nouvelle date</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#2196F3" />
                <Text style={styles.pickerBtnText}>
                  {nouveauJour.toLocaleDateString('fr-FR')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={nouveauJour}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) setNouveauJour(selectedDate);
                  }}
                />
              )}

              <Text style={styles.modalLabel}>Nouvelle heure</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={18} color="#2196F3" />
                <Text style={styles.pickerBtnText}>
                  {nouvelleHeure.toTimeString().slice(0, 5)}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={nouvelleHeure}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (selectedTime) setNouvelleHeure(selectedTime);
                  }}
                />
              )}

              <Text style={styles.modalLabel}>Commentaire (optionnel)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Raison du report, précisions..."
                placeholderTextColor="#aaa"
                value={commentaire}
                onChangeText={setCommentaire}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={submitReport}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Envoyer la proposition</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F8F9FA' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },

  header:          { backgroundColor: '#fff', paddingTop: 55, paddingBottom: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle:     { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub:       { fontSize: 13, color: '#888', marginTop: 2 },

  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', width: '47%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statLabel:       { fontSize: 12, color: '#888', marginTop: 6 },
  statCount:       { fontSize: 24, fontWeight: 'bold', marginTop: 2 },

  searchBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#eee' },
  searchInput:     { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },

  filterBtn:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginRight: 8, gap: 4 },
  filterBtnActive: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
  filterText:      { fontSize: 13, color: '#555' },

  resultCount:     { paddingHorizontal: 16, paddingBottom: 8, fontSize: 12, color: '#aaa' },

  card:            { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader:      { flexDirection: 'row', gap: 12 },
  avatar:          { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  avatarText:      { fontSize: 22, fontWeight: 'bold', color: '#2196F3' },
  patientName:     { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  dateRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dateText:        { fontSize: 12, color: '#888' },
  motif:           { fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' },
  badge:           { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  badgeText:       { fontSize: 11, fontWeight: 'bold' },

  actions:         { flexDirection: 'row', marginTop: 14, gap: 8 },
  btn:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 5 },
  btnText:         { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnIcon:         { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  reportInfo:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', padding: 10, borderRadius: 10, marginTop: 12, gap: 6 },
  reportInfoText:  { fontSize: 12, color: '#1565C0', flex: 1 },

  dossierBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', gap: 6 },
  dossierBtnText:  { color: '#2563eb', fontWeight: '600', fontSize: 13 },

  emptyText:       { color: '#bbb', marginTop: 12, fontSize: 16 },

  // Modal Reporter
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle:      { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  modalSubtitle:   { fontSize: 13, color: '#888', marginBottom: 12 },
  modalLabel:      { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 14, marginBottom: 6 },
  pickerBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', padding: 12, borderRadius: 10 },
  pickerBtnText:   { fontSize: 14, color: '#333' },
  commentInput:    { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', textAlignVertical: 'top', minHeight: 80 },
  submitBtn:       { flexDirection: 'row', backgroundColor: '#2196F3', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  submitBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
});