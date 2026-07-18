// app/medecinPages/dashboardDoc.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import API_ENDPOINTS, { api } from '../../config/api';

export default function DashboardDoc() {
  const [medecin, setMedecin]       = useState(null);
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const fetchDashboard = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const role = await AsyncStorage.getItem('role');
      if (role !== 'medecin') {
        router.replace('/');
        return;
      }

      const res = await api.get(API_ENDPOINTS.MEDECINS.DASHBOARD, {
        timeout: 15000,
      });

      setMedecin(res.data.medecin);
      setRendezvous(res.data.rendezvous || []);
      setError('');
    } catch (e) {
      console.log('ERREUR dashboard:', e?.response?.data || e.message);

      if (e.response?.status === 401) {
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'role']);
        router.replace('/');
        return;
      }

      setError(
        e.code === 'ECONNABORTED'
          ? 'Le serveur met trop de temps à répondre.'
          : 'Impossible de charger le dashboard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(false);
  };

  // ── Stats ────────────────────────────────────────────
  const total    = rendezvous.length;
  const pending  = rendezvous.filter(r => r.statut === 'en_attente').length;
  const accepted = rendezvous.filter(r => r.statut === 'confirme').length;
  const done     = rendezvous.filter(r => r.statut === 'termine').length;

  const today    = new Date().toISOString().split('T')[0];
  const todayRdv = rendezvous
    .filter(r => r.date === today)
    .sort((a, b) => a.heure.localeCompare(b.heure));

  const capacite     = total > 0 ? Math.min(Math.round((accepted / total) * 100), 100) : 0;
  const tempsReponse = total > 0 ? Math.min(Math.round((done / total) * 100), 100) : 0;

  const formatTime = (heure) => {
    if (!heure) return { time: '--:--', period: 'AM' };
    const [h, m] = heure.split(':');
    const hour   = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return { time: `${String(displayHour).padStart(2, '0')}:${m}`, period };
  };

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error && !medecin) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        <Text style={[styles.loadingText, { color: '#EF4444', marginTop: 12 }]}>{error}</Text>
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 }}
          onPress={() => fetchDashboard(true)}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={26} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MediConnect</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/medecinPages/profile')}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* BIENVENUE */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeBack}>BIENVENUE</Text>
          <Text style={styles.greeting}>
            {getGreeting()},{'\n'}Dr. {medecin?.prenom || ''} {medecin?.nom || 'Médecin'}
          </Text>
          <Text style={styles.subGreeting}>
            {dateAujourdhui} — voici un aperçu de votre activité du jour.
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.exportBtn}>
              <Feather name="download" size={16} color="#374151" />
              <Text style={styles.exportText}> Exporter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scheduleBtn}
              onPress={() => router.push('/medecinPages/horaire')}
            >
              <Text style={styles.scheduleBtnText}>+ Nouvel horaire</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <StatCard
          icon={<MaterialCommunityIcons name="calendar-month" size={26} color="#2563EB" />}
          iconBg="#EFF6FF"
          label="Total rendez-vous"
          value={total}
          badge={`${total} au total`}
          badgeColor="#16A34A"
          badgeBg="#DCFCE7"
        />
        <StatCard
          icon={<MaterialCommunityIcons name="calendar-clock" size={26} color="#F59E0B" />}
          iconBg="#FFFBEB"
          label="En attente"
          value={pending}
          badge="Mis à jour quotidiennement"
          badgeColor="#6B7280"
          badgeBg="#F3F4F6"
        />
        <StatCard
          icon={<MaterialCommunityIcons name="check-circle-outline" size={26} color="#2563EB" />}
          iconBg="#EFF6FF"
          label="Confirmés"
          value={accepted}
          badge="Confirmés"
          badgeColor="#16A34A"
          badgeBg="#DCFCE7"
        />
        <StatCard
          icon={<MaterialCommunityIcons name="check-all" size={26} color="#6B7280" />}
          iconBg="#F3F4F6"
          label="Terminés"
          value={done}
          badge="Finalisés"
          badgeColor="#6B7280"
          badgeBg="#F3F4F6"
        />

        {/* PLANNING DU JOUR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Planning du jour</Text>
          <TouchableOpacity onPress={() => router.push('/medecinPages/appointment')}>
            <Text style={styles.sectionLink}>Voir le calendrier</Text>
          </TouchableOpacity>
        </View>

        {todayRdv.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun rendez-vous aujourd'hui</Text>
          </View>
        ) : (
          todayRdv.map((rdv, i) => {
            const { time, period } = formatTime(rdv.heure);
            const colors = ['#2563EB', '#0D9488', '#6B7280'];
            return (
              <TouchableOpacity
                key={i}
                style={styles.scheduleCard}
                onPress={() => router.push('/medecinPages/appointment')}
              >
                <View style={[styles.timeBox, { borderLeftColor: colors[i % 3] }]}>
                  <Text style={[styles.timeText, { color: colors[i % 3] }]}>{time}</Text>
                  <Text style={[styles.timePeriod, { color: colors[i % 3] }]}>{period}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.patientName}>
                    {rdv.patient_prenom || ''} {rdv.patient_nom || 'Patient'}
                  </Text>
                  <Text style={styles.motif}>{rdv.motif || 'Consultation'}</Text>
                  <View style={statutBadgeStyle(rdv.statut)}>
                    <Text style={statutTextStyle(rdv.statut)}>
                      {rdv.statut === 'en_attente' ? 'En attente'
                        : rdv.statut === 'confirme' ? 'Confirmé'
                        : rdv.statut === 'termine'  ? 'Terminé'
                        : rdv.statut}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })
        )}

        {/* BANNIÈRE MÉTRIQUES */}
        <View style={styles.metricsBanner}>
          <Text style={styles.metricsTitle}>Résumé de votre journée</Text>
          <Text style={styles.metricsSubtitle}>
            Vous avez {todayRdv.length} rendez-vous aujourd'hui et {pending} en attente de confirmation.
            Continuez comme ça, Dr. {medecin?.nom || ''} !
          </Text>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => router.push('/medecinPages/appointment')}
          >
            <Text style={styles.reportBtnText}>Rapport complet</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVITÉ RÉCENTE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          <TouchableOpacity onPress={() => router.push('/medecinPages/appointment')}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {rendezvous.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Aucune activité récente</Text>
            </View>
          ) : (
            rendezvous.slice(0, 4).map((rdv, i) => (
              <View key={i} style={[styles.activityItem, i < 3 && styles.activityBorder]}>
                <View style={[styles.dot, {
                  backgroundColor:
                    rdv.statut === 'confirme'   ? '#2563EB' :
                    rdv.statut === 'en_attente' ? '#F59E0B' :
                    rdv.statut === 'termine'    ? '#10B981' : '#6B7280'
                }]} />
                <View style={styles.activityText}>
                  <Text style={styles.activityDesc}>
                    Rendez-vous{' '}
                    <Text style={styles.bold}>
                      {rdv.patient_prenom || ''} {rdv.patient_nom || 'Patient'}
                    </Text>
                    {' '}— {rdv.motif || 'Consultation'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {rdv.date || ''}{rdv.heure ? ` à ${rdv.heure.slice(0, 5)}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push('/medecinPages/appointment')}
          >
            <Text style={styles.viewAllText}>Voir toute l'activité</Text>
          </TouchableOpacity>
        </View>

        {/* SANTÉ DU CABINET */}
        <View style={styles.practiceCard}>
          <Text style={styles.practiceTitle}>SANTÉ DU CABINET</Text>
          <ProgressBar
            label="Taux d'occupation"
            value={capacite}
            unit={`${capacite}%`}
            color="#2563EB"
          />
          <ProgressBar
            label="Taux de finalisation"
            value={tempsReponse}
            unit={`${tempsReponse}%`}
            color="#0D9488"
          />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ── Helpers statut ───────────────────────────────────────────────────────────
const statutBadgeStyle = (statut) => ({
  marginTop: 6, alignSelf: 'flex-start',
  paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  backgroundColor:
    statut === 'confirme'   ? '#DCFCE7' :
    statut === 'en_attente' ? '#FEF9C3' : '#F3F4F6',
});

const statutTextStyle = (statut) => ({
  fontSize: 11, fontWeight: '700',
  color:
    statut === 'confirme'   ? '#16A34A' :
    statut === 'en_attente' ? '#CA8A04' : '#6B7280',
});

// ── Composants ───────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, value, badge, badgeColor, badgeBg }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ProgressBar({ label, value, unit, color }) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{unit}</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText:      { color: '#2563EB', fontSize: 16 },
  scroll:           { paddingHorizontal: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: '#2563EB' },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn:      { padding: 4 },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center',
  },

  welcomeSection: { paddingTop: 20, paddingBottom: 16 },
  welcomeBack:    { fontSize: 12, fontWeight: '700', color: '#2563EB', letterSpacing: 1 },
  greeting:       { fontSize: 28, fontWeight: '800', color: '#111827', lineHeight: 36, marginTop: 4 },
  subGreeting:    { fontSize: 14, color: '#6B7280', marginTop: 6 },
  actionRow:      { flexDirection: 'row', gap: 12, marginTop: 16 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 25,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  exportText:      { color: '#374151', fontSize: 14, fontWeight: '500' },
  scheduleBtn:     { backgroundColor: '#2563EB', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10 },
  scheduleBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  statCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  statTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statIcon:  { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  statLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  statValue: { fontSize: 32, fontWeight: '800', color: '#111827' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sectionLink:  { fontSize: 14, color: '#2563EB', fontWeight: '600' },

  scheduleCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  timeBox:      { borderLeftWidth: 3, paddingLeft: 10, marginRight: 14, minWidth: 56 },
  timeText:     { fontSize: 16, fontWeight: '700' },
  timePeriod:   { fontSize: 12, fontWeight: '600' },
  scheduleInfo: { flex: 1 },
  patientName:  { fontSize: 15, fontWeight: '700', color: '#111827' },
  motif:        { fontSize: 13, color: '#6B7280', marginTop: 2 },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 28,
    alignItems: 'center', marginBottom: 10, gap: 10,
  },
  emptyText: { color: '#9CA3AF', fontSize: 14 },

  metricsBanner: {
    backgroundColor: '#2563EB', borderRadius: 20,
    padding: 24, alignItems: 'center', marginVertical: 16,
  },
  metricsTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  metricsSubtitle: { fontSize: 14, color: '#BFDBFE', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  reportBtn: {
    backgroundColor: '#fff', borderRadius: 25,
    paddingHorizontal: 28, paddingVertical: 12, marginTop: 16,
  },
  reportBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 15 },

  activityCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  activityItem:   { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dot:            { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  activityText:   { flex: 1 },
  activityDesc:   { fontSize: 14, color: '#374151', lineHeight: 20 },
  bold:           { fontWeight: '700', color: '#111827' },
  activityTime:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  viewAllBtn:     { alignItems: 'center', paddingTop: 12 },
  viewAllText:    { color: '#6B7280', fontSize: 14, fontWeight: '500' },

  practiceCard:      { backgroundColor: '#F3F4F6', borderRadius: 16, padding: 20, marginBottom: 8 },
  practiceTitle:     { fontSize: 13, fontWeight: '800', color: '#374151', letterSpacing: 1, marginBottom: 16 },
  progressContainer: { marginBottom: 16 },
  progressHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:     { fontSize: 14, color: '#374151' },
  progressValue:     { fontSize: 14, fontWeight: '700', color: '#111827' },
  progressBg:        { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 },
  progressFill:      { height: 8, borderRadius: 4 },
});