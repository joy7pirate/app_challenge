// app/medecinPages/horaire.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
  RefreshControl, ScrollView, Platform, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API_ENDPOINTS, { api } from '../../config/api';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const JOUR_COLORS = {
  Lundi:    '#E3F2FD',
  Mardi:    '#F3E5F5',
  Mercredi: '#E8F5E9',
  Jeudi:    '#FFF3E0',
  Vendredi: '#FCE4EC',
  Samedi:   '#E0F7FA',
  Dimanche: '#F1F8E9',
};

const JOUR_TEXT_COLORS = {
  Lundi:    '#1565C0',
  Mardi:    '#6A1B9A',
  Mercredi: '#2E7D32',
  Jeudi:    '#E65100',
  Vendredi: '#880E4F',
  Samedi:   '#00695C',
  Dimanche: '#558B2F',
};

const JOUR_NUM = {
  Lundi: '01', Mardi: '02', Mercredi: '03',
  Jeudi: '04', Vendredi: '05', Samedi: '06', Dimanche: '07'
};

const formatHeure = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

export default function HoraireScreen() {
  const [dispos, setDispos]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [view, setView]                 = useState('list');
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState({
    jour: 'Lundi', heure_debut: '', heure_fin: ''
  });
  const [saving, setSaving]       = useState(false);
  const [medecinId, setMedecinId] = useState(null);

  // ── Get medecin id ──────────────────────────────────────────────────────────
  useEffect(() => {
    const getMedecinId = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.AUTH.ME);
        setMedecinId(res.data.medecin_id);
      } catch (e) {
        console.log('medecin id error', e?.response?.data || e.message);
      }
    };
    getMedecinId();
  }, []);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchDispos = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.DISPONIBILITES.LIST, {
        params: { medecin: medecinId }
      });
      const sorted = [...res.data].sort(
        (a, b) => JOURS.indexOf(a.jour) - JOURS.indexOf(b.jour)
      );
      setDispos(sorted);
    } catch (e) {
      console.log('ERREUR fetchDispos:', e?.response?.data || e.message);
      Alert.alert('Erreur', 'Impossible de charger les disponibilités');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId]);

  useEffect(() => {
    if (medecinId) fetchDispos();
  }, [medecinId, fetchDispos]);

  // ── Ouvrir modal ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditItem(null);
    setForm({ jour: 'Lundi', heure_debut: '', heure_fin: '' });
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      jour:        item.jour,
      heure_debut: item.heure_debut.slice(0, 5),
      heure_fin:   item.heure_fin.slice(0, 5),
    });
    setModalVisible(true);
  };

  // ── Sauvegarder ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.heure_debut || !form.heure_fin) {
      Alert.alert('Erreur', 'Veuillez remplir les heures');
      return;
    }
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(form.heure_debut) || !timeRegex.test(form.heure_fin)) {
      Alert.alert('Erreur', 'Format invalide. Utilisez HH:MM (ex: 08:00)');
      return;
    }
    if (form.heure_debut >= form.heure_fin) {
      Alert.alert('Erreur', "L'heure de fin doit être après l'heure de début");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        jour:        form.jour,
        heure_debut: form.heure_debut,
        heure_fin:   form.heure_fin,
        medecin:     medecinId,
      };

      if (editItem) {
        await api.put(API_ENDPOINTS.DISPONIBILITES.UPDATE(editItem.id), payload);
      } else {
        await api.post(API_ENDPOINTS.DISPONIBILITES.CREATE, payload);
      }

      setModalVisible(false);
      fetchDispos();
    } catch (e) {
      console.log('ERREUR handleSave:', e?.response?.data || e.message);
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  // ── Supprimer ────────────────────────────────────────────────────────────────
  const handleDelete = (item) => {
    Alert.alert(
      'Supprimer',
      `Supprimer ${item.jour} ${formatHeure(item.heure_debut)} - ${formatHeure(item.heure_fin)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.DISPONIBILITES.DELETE(item.id));
              fetchDispos();
            } catch (e) {
              console.log('ERREUR handleDelete:', e?.response?.data || e.message);
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  // ── Render Card ──────────────────────────────────────────────────────────────
  const renderCard = ({ item }) => {
    const bg  = JOUR_COLORS[item.jour]      || '#F5F5F5';
    const tc  = JOUR_TEXT_COLORS[item.jour] || '#333';
    const num = JOUR_NUM[item.jour]         || '--';

    return (
      <View style={styles.card}>
        <View style={[styles.dateBox, { backgroundColor: bg }]}>
          <Text style={[styles.dateMonth, { color: tc }]}>SEM</Text>
          <Text style={[styles.dateNum,   { color: tc }]}>{num}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.jourText}>{item.jour}</Text>
          <View style={styles.heureRow}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={styles.heureText}>
              {formatHeure(item.heure_debut)} - {formatHeure(item.heure_fin)}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil-outline" size={18} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Planning View ────────────────────────────────────────────────────────────
  const renderPlanning = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {JOURS.map(jour => {
        const slots = dispos.filter(d => d.jour === jour);
        const bg = JOUR_COLORS[jour] || '#F5F5F5';
        const tc = JOUR_TEXT_COLORS[jour] || '#333';
        return (
          <View key={jour} style={styles.planningRow}>
            <View style={[styles.planningJour, { backgroundColor: bg }]}>
              <Text style={[styles.planningJourText, { color: tc }]}>
                {jour.slice(0, 3).toUpperCase()}
              </Text>
            </View>
            <View style={styles.planningSlots}>
              {slots.length === 0 ? (
                <Text style={styles.noSlot}>—</Text>
              ) : (
                slots.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.slotBadge, { backgroundColor: bg }]}
                    onLongPress={() => handleDelete(s)}
                    onPress={() => openEdit(s)}
                  >
                    <Text style={[styles.slotText, { color: tc }]}>
                      {formatHeure(s.heure_debut)} - {formatHeure(s.heure_fin)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        );
      })}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ── Modal Form ───────────────────────────────────────────────────────────────
  const renderModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalBox}>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editItem ? 'Modifier la disponibilité' : 'Ajouter une disponibilité'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Jour selector */}
              <Text style={styles.label}>Jour</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {JOURS.map(j => (
                  <TouchableOpacity
                    key={j}
                    style={[
                      styles.jourChip,
                      form.jour === j && styles.jourChipActive
                    ]}
                    onPress={() => setForm(f => ({ ...f, jour: j }))}
                  >
                    <Text style={[
                      styles.jourChipText,
                      form.jour === j && styles.jourChipTextActive
                    ]}>
                      {j.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Heures */}
              <Text style={styles.label}>Heure de début (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="ex : 08:00"
                value={form.heure_debut}
                onChangeText={t => setForm(f => ({ ...f, heure_debut: t }))}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />

              <Text style={styles.label}>Heure de fin (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="ex : 17:00"
                value={form.heure_fin}
                onChangeText={t => setForm(f => ({ ...f, heure_fin: t }))}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />

              {/* Bouton */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>
                      {editItem ? 'Modifier' : 'Ajouter'}
                    </Text>
                }
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ── UI ───────────────────────────────────────────────────────────────────────
  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gérer les disponibilités</Text>
        <Text style={styles.headerSub}>Définissez et ajustez vos horaires de travail</Text>
      </View>

      {/* Toggle View */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
          onPress={() => setView('list')}
        >
          <Ionicons name="list-outline" size={16} color={view === 'list' ? '#2196F3' : '#888'} />
          <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>
            Vue liste
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'planning' && styles.toggleBtnActive]}
          onPress={() => setView('planning')}
        >
          <Ionicons name="calendar-outline" size={16} color={view === 'planning' ? '#2196F3' : '#888'} />
          <Text style={[styles.toggleText, view === 'planning' && styles.toggleTextActive]}>
            Vue planning
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {view === 'list' ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>CRÉNEAUX À VENIR</Text>
            <TouchableOpacity onPress={openCreate}>
              <Text style={styles.editAll}>Tout modifier</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={dispos}
            keyExtractor={item => item.id.toString()}
            renderItem={renderCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => {
                setRefreshing(true);
                fetchDispos();
              }} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Aucune disponibilité</Text>
              </View>
            }
            ListFooterComponent={
              <View style={styles.coverageCard}>
                <Ionicons name="time-outline" size={32} color="#aaa" />
                <Text style={styles.coverageTitle}>Besoin de plus de créneaux ?</Text>
                <Text style={styles.coverageSub}>
                  Ajoutez des créneaux récurrents pour remplir votre planning automatiquement.
                </Text>
                <TouchableOpacity style={styles.addAvailBtn} onPress={openCreate}>
                  <Text style={styles.addAvailText}>Ajouter une disponibilité</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </>
      ) : renderPlanning()}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      {renderModal()}

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F0F4F8' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#F0F4F8' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  headerSub:   { fontSize: 14, color: '#888', marginTop: 4 },

  toggleRow:        { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#E0E0E0', borderRadius: 12, padding: 4 },
  toggleBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  toggleBtnActive:  { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  toggleText:       { fontSize: 13, color: '#888', fontWeight: '600' },
  toggleTextActive: { color: '#2196F3' },

  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#aaa', letterSpacing: 1 },
  editAll:      { fontSize: 14, color: '#2196F3', fontWeight: '600' },

  card:        { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dateBox:     { width: 52, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  dateMonth:   { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  dateNum:     { fontSize: 22, fontWeight: '800' },
  cardInfo:    { flex: 1 },
  jourText:    { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  heureRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  heureText:   { fontSize: 13, color: '#666' },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn:     { backgroundColor: '#F5F5F5', padding: 8, borderRadius: 10 },

  coverageCard:  { margin: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#D0D0D0', borderStyle: 'dashed', backgroundColor: '#fff', padding: 24, alignItems: 'center' },
  coverageTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 12 },
  coverageSub:   { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6, marginBottom: 16 },
  addAvailBtn:   { backgroundColor: '#1565C0', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  addAvailText:  { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyBox:  { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: '#bbb', marginTop: 12, fontSize: 16 },

  planningRow:      { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, alignItems: 'flex-start' },
  planningJour:     { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  planningJourText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  planningSlots:    { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 6 },
  noSlot:           { fontSize: 20, color: '#ddd', paddingTop: 4 },
  slotBadge:        { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  slotText:         { fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  label:        { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  input:        { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#333', marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  jourChip:           { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8 },
  jourChipActive:     { backgroundColor: '#1565C0' },
  jourChipText:       { fontSize: 13, color: '#555', fontWeight: '600' },
  jourChipTextActive: { color: '#fff' },
  saveBtn:      { backgroundColor: '#1565C0', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },

  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: '#1565C0', width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
});