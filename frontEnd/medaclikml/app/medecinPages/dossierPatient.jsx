import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Modal,
  KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { api, apiService } from '../../config/api'; // ✅ chemin à adapter si besoin

// ── Composant Section ──────────────────────────────────────────────────────
const Section = ({ title, icon, color, children, onAdd }) => (
  <View style={styles.card}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      {onAdd && (
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: color + '20', borderColor: color }]} onPress={onAdd}>
          <Ionicons name="add" size={18} color={color} />
          <Text style={[styles.addBtnText, { color }]}>Ajouter</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// ── Composant Field ─────────────────────────────────────────────────────────
const Field = ({ label, value, onChangeText, placeholder, multiline }) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
    />
  </View>
);

// ── Composant Tag ────────────────────────────────────────────────────────────
const Tag = ({ text, color }) => (
  <View style={[styles.tag, { backgroundColor: color + '15' }]}>
    <Text style={[styles.tagText, { color }]}>{text}</Text>
  </View>
);

// ── Composant Bouton Principal ─────────────────────────────────────────────
const BoutonPrincipal = ({ title, onPress, couleur = '#dc2626', desactive = false }) => (
  <TouchableOpacity
    style={[styles.boutonPrincipal, { backgroundColor: desactive ? '#d1d5db' : couleur }, desactive && styles.boutonDesactive]}
    onPress={onPress}
    disabled={desactive}
  >
    <Text style={styles.boutonPrincipalText}>{title}</Text>
  </TouchableOpacity>
);

// ── Composant ConsultModal ──────────────────────────────────────────────────
const ConsultModal = ({ visible, onClose, selectedRdvId, setSelectedConsultationId, fetchDossier }) => {
  const [consultForm, setConsultForm] = useState({
    diagnostic: '',
    traitement: '',
    notes: '',
    motif: '',
  });

  const handleCreate = async () => {
    if (!consultForm.diagnostic.trim()) {
      Alert.alert('Erreur', 'Le diagnostic est obligatoire.');
      return;
    }
    if (!selectedRdvId) {
      Alert.alert('Erreur', 'Aucun rendez-vous sélectionné pour créer la consultation.');
      return;
    }
    try {
      const res = await api.post('/consultations/create/', {
        rdv: selectedRdvId,
        motif: consultForm.motif,
        diagnostic: consultForm.diagnostic,
        traitement: consultForm.traitement,
        notes: consultForm.notes,
      });

      const nouvelleConsultationId = res.data.id;
      console.log('✅ Consultation créée, ID réel :', nouvelleConsultationId);
      setSelectedConsultationId(nouvelleConsultationId);

      Alert.alert('Succès', 'Consultation créée avec succès !');
      setConsultForm({ diagnostic: '', traitement: '', notes: '', motif: '' });
      onClose();
      if (fetchDossier) fetchDossier();
    } catch (err) {
      console.error('Erreur création consultation :', err.response?.data);
      const msg = err.response?.data?.error || err.response?.data?.detail;
      if (msg && msg.toLowerCase().includes('existe déjà')) {
        Alert.alert('Info', 'Une consultation existe déjà pour ce rendez-vous.');
        onClose();
        if (fetchDossier) fetchDossier();
      } else {
        Alert.alert('Erreur', msg || "Impossible de créer la consultation.");
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBoite}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitre}>Nouvelle Consultation</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalCorps}>
            <Field label="Diagnostic *" value={consultForm.diagnostic} onChangeText={(t) => setConsultForm({ ...consultForm, diagnostic: t })} placeholder="Diagnostic de la consultation" multiline />
            <Field label="Traitement" value={consultForm.traitement} onChangeText={(t) => setConsultForm({ ...consultForm, traitement: t })} placeholder="Prescription médicale" multiline />
            <Field label="Notes" value={consultForm.notes} onChangeText={(t) => setConsultForm({ ...consultForm, notes: t })} placeholder="Notes additionnelles" multiline />
            <Field label="Motif" value={consultForm.motif} onChangeText={(t) => setConsultForm({ ...consultForm, motif: t })} placeholder="Motif de consultation" />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.boutonAnnuler} onPress={onClose}><Text style={styles.boutonAnnulerText}>Annuler</Text></TouchableOpacity>
            <BoutonPrincipal title="Créer Consultation" onPress={handleCreate} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ── Composant OrdoModal ──────────────────────────────────────────────────────
const OrdoModal = ({ visible, onClose, selectedConsultationId, fetchDossier }) => {
  const [ordoForm, setOrdoForm] = useState({ medicaments: '', posologie: '', duree: '', instructions: '' });

  const handleCreate = async () => {
    if (!ordoForm.medicaments.trim()) {
      Alert.alert('Erreur', 'Les médicaments sont obligatoires.');
      return;
    }
    if (!selectedConsultationId) {
      Alert.alert('Erreur', "Vous devez d'abord créer une consultation pour ce rendez-vous.");
      return;
    }
    try {
      const payload = {
        consultation: selectedConsultationId,
        medicaments: ordoForm.medicaments,
        posologie: ordoForm.posologie,
        duree: ordoForm.duree,
        instructions: ordoForm.instructions,
      };

      console.log('📡 Payload ordonnance:', payload);

      await api.post('/ordonnances/create/', payload);

      Alert.alert('Succès', 'Ordonnance créée avec succès !');
      setOrdoForm({ medicaments: '', posologie: '', duree: '', instructions: '' });
      onClose();
      if (fetchDossier) fetchDossier();
    } catch (err) {
      console.error('Erreur création ordonnance :', err.response?.data);
      Alert.alert('Erreur', err.response?.data?.error || err.response?.data?.detail || "Impossible de créer l'ordonnance.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBoite}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitre}>Nouvelle Ordonnance</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalCorps}>
            <Field label="Médicaments *" value={ordoForm.medicaments} onChangeText={(t) => setOrdoForm({ ...ordoForm, medicaments: t })} placeholder="Liste des médicaments" multiline />
            <Field label="Posologie" value={ordoForm.posologie} onChangeText={(t) => setOrdoForm({ ...ordoForm, posologie: t })} placeholder="Ex: 2 fois par jour" />
            <Field label="Durée" value={ordoForm.duree} onChangeText={(t) => setOrdoForm({ ...ordoForm, duree: t })} placeholder="Ex: 7 jours" />
            <Field label="Instructions" value={ordoForm.instructions} onChangeText={(t) => setOrdoForm({ ...ordoForm, instructions: t })} placeholder="Instructions spéciales" multiline />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.boutonAnnuler} onPress={onClose}><Text style={styles.boutonAnnulerText}>Annuler</Text></TouchableOpacity>
            <BoutonPrincipal title="Créer Ordonnance" onPress={handleCreate} couleur="#059669" />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ── Composant ExamenModal ────────────────────────────────────────────────────
const ExamenModal = ({ visible, onClose, selectedPatientId, fetchDossier }) => {
  const [examenForm, setExamenForm] = useState({
    type_examen: 'analyse',
    description: '',
    resultat: '',
  });
  const [fichierSelectionne, setFichierSelectionne] = useState(null);

  const choisirFichier = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setFichierSelectionne(result.assets[0]);
    } catch (e) {
      console.error('Erreur sélection fichier :', e);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  const handleCreateExamen = async () => {
    if (!examenForm.description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('type_examen', examenForm.type_examen);
      formData.append('description', examenForm.description);
      formData.append('resultat', examenForm.resultat);
      formData.append('patient', selectedPatientId);
      if (fichierSelectionne) {
        formData.append('fichier', {
          uri: fichierSelectionne.uri,
          name: fichierSelectionne.name,
          type: fichierSelectionne.mimeType || 'application/octet-stream',
        });
      }

      await api.post('/examens/create/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Succès', 'Examen ajouté avec succès !');
      setExamenForm({ type_examen: 'analyse', description: '', resultat: '' });
      setFichierSelectionne(null);
      onClose();
      if (fetchDossier) fetchDossier();
    } catch (e) {
      console.error('Erreur création examen :', e.response?.data);
      Alert.alert('Erreur', "Impossible de créer l'examen.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBoite}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitre}>Nouvel Examen</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalCorps}>
            <Text style={styles.label}>Type d'examen *</Text>
            <View style={styles.typeSelector}>
              {[
                { key: 'analyse', label: 'Analyse' },
                { key: 'imagerie', label: 'Imagerie' },
                { key: 'autre', label: 'Autre' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, examenForm.type_examen === t.key && styles.typeBtnActive]}
                  onPress={() => setExamenForm({ ...examenForm, type_examen: t.key })}
                >
                  <Text style={[styles.typeBtnText, examenForm.type_examen === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Fichier joint (optionnel)</Text>
            <TouchableOpacity style={styles.fileBtn} onPress={choisirFichier}>
              <Ionicons name="attach-outline" size={18} color="#dc2626" />
              <Text style={styles.fileBtnText}>
                {fichierSelectionne ? fichierSelectionne.name : 'Choisir un fichier (PDF/Image)'}
              </Text>
            </TouchableOpacity>

            <Field label="Description *" value={examenForm.description} onChangeText={(t) => setExamenForm({ ...examenForm, description: t })} placeholder="Description de l'examen" multiline />
            <Field label="Résultat" value={examenForm.resultat} onChangeText={(t) => setExamenForm({ ...examenForm, resultat: t })} placeholder="Résultat de l'examen" multiline />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.boutonAnnuler} onPress={onClose}><Text style={styles.boutonAnnulerText}>Annuler</Text></TouchableOpacity>
            <BoutonPrincipal title="Créer Examen" onPress={handleCreateExamen} couleur="#7c3aed" />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ── Composant DossierMedicalScreen ──────────────────────────────────────────
export default function DossierMedicalScreen() {
  const params = useLocalSearchParams();

  const getParamValue = (value) => (Array.isArray(value) ? value[0] : value);
  const rawPatientId = getParamValue(params.patientId ?? params.patient_id ?? params.id ?? params.patient?.id);
  const selectedPatientId = rawPatientId ? Number(rawPatientId) : null;
  const rawRdvId = getParamValue(params.rdvId ?? params.rdv_id ?? params.rdv ?? params.rendez_vous ?? params.rendezvous);
  const selectedRdvId = rawRdvId ? Number(rawRdvId) : null;

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('infos');

  const [consultModalVisible, setConsultModalVisible] = useState(false);
  const [ordoModalVisible, setOrdoModalVisible] = useState(false);
  const [examenModalVisible, setExamenModalVisible] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);

  // ── Récupération du dossier patient ────────────────────────────────────
  const fetchDossier = useCallback(async () => {
    if (!selectedPatientId) {
      setError('Aucun patient sélectionné.');
      setLoading(false);
      return;
    }
    try {
      setError('');
      const response = await apiService.getPatientDossier(selectedPatientId);
      setDossier(response.data);
    } catch (err) {
      console.error('Erreur chargement dossier :', err);
      if (err.code === 'ECONNABORTED') {
        setError('Le serveur ne répond pas (timeout). Vérifiez votre connexion.');
      } else if (err.response?.status === 404) {
        setError('Dossier patient introuvable.');
      } else if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(err.response?.data?.detail || 'Impossible de charger le dossier.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDossier();
  };

  // ── Gestion ouverture modales ───────────────────────────────────────────
  const ouvrirModalConsultation = () => {
    if (!selectedRdvId) {
      Alert.alert('Info', 'Aucun rendez-vous associé pour créer une consultation.');
      return;
    }
    setConsultModalVisible(true);
  };

  const ouvrirModalOrdonnance = (consultationId) => {
    if (!consultationId) {
      Alert.alert('Info', "Créez d'abord une consultation pour ajouter une ordonnance.");
      return;
    }
    setSelectedConsultationId(consultationId);
    setOrdoModalVisible(true);
  };

  const ouvrirModalExamen = () => {
    if (!selectedPatientId) {
      Alert.alert('Erreur', 'Patient introuvable.');
      return;
    }
    setExamenModalVisible(true);
  };

  // ── Statut couleur ───────────────────────────────────────────────────────
  const getStatutColor = (statut) => {
    switch (statut) {
      case 'confirme': return '#059669';
      case 'en_attente': return '#f59e0b';
      case 'annule': return '#dc2626';
      case 'termine': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // ── États de chargement / erreur ─────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Chargement du dossier...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDossier}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#6b7280' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const patient = dossier?.patient || {};
  const consultations = dossier?.consultations || [];
  const ordonnances = dossier?.ordonnances || [];
  const examens = dossier?.examens || [];

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>
            {patient.prenom || ''} {patient.nom || 'Dossier patient'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {patient.telephone || ''}
          </Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {[
          { key: 'infos', label: 'Infos', icon: 'person-outline' },
          { key: 'consultations', label: 'Consultations', icon: 'medkit-outline' },
          { key: 'ordonnances', label: 'Ordonnances', icon: 'document-text-outline' },
          { key: 'examens', label: 'Examens', icon: 'flask-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? '#dc2626' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Contenu ── */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#dc2626']} />}
      >
        {activeTab === 'infos' && (
          <Section title="Informations Patient" icon="person" color="#dc2626">
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom complet</Text>
              <Text style={styles.infoValue}>{patient.prenom} {patient.nom}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{patient.telephone || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{patient.email || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de naissance</Text>
              <Text style={styles.infoValue}>{patient.date_naissance || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sexe</Text>
              <Text style={styles.infoValue}>{patient.sexe || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Groupe sanguin</Text>
              <Text style={styles.infoValue}>{patient.groupe_sanguin || '—'}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Allergies</Text>
              <Text style={styles.infoValue}>{patient.allergies || 'Aucune connue'}</Text>
            </View>
          </Section>
        )}

        {activeTab === 'consultations' && (
          <Section title="Consultations" icon="medkit" color="#dc2626" onAdd={ouvrirModalConsultation}>
            {consultations.length === 0 ? (
              <Text style={styles.emptyText}>Aucune consultation enregistrée.</Text>
            ) : (
              consultations.map((c) => (
                <View key={c.id} style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemTitle}>{c.diagnostic}</Text>
                    <Tag text={c.motif || 'Consultation'} color="#dc2626" />
                  </View>
                  {c.traitement && <Text style={styles.listItemSub}>Traitement : {c.traitement}</Text>}
                  {c.notes && <Text style={styles.listItemSub}>Notes : {c.notes}</Text>}
                  <Text style={styles.listItemDate}>{c.date_creation || c.created_at || ''}</Text>
                  <TouchableOpacity style={styles.ordoAddBtn} onPress={() => ouvrirModalOrdonnance(c.id)}>
                    <Ionicons name="add-circle-outline" size={16} color="#059669" />
                    <Text style={{ color: '#059669', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                      Ajouter Ordonnance
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Section>
        )}

        {activeTab === 'ordonnances' && (
          <Section title="Ordonnances" icon="document-text" color="#059669">
            {ordonnances.length === 0 ? (
              <Text style={styles.emptyText}>Aucune ordonnance enregistrée.</Text>
            ) : (
              ordonnances.map((o) => (
                <View key={o.id} style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemTitle}>{o.medicaments}</Text>
                  </View>
                  {o.posologie && <Text style={styles.listItemSub}>Posologie : {o.posologie}</Text>}
                  {o.duree && <Text style={styles.listItemSub}>Durée : {o.duree}</Text>}
                  {o.instructions && <Text style={styles.listItemSub}>Instructions : {o.instructions}</Text>}
                  <Text style={styles.listItemDate}>{o.date_creation || o.created_at || ''}</Text>
                </View>
              ))
            )}
          </Section>
        )}

        {activeTab === 'examens' && (
          <Section title="Examens" icon="flask" color="#7c3aed" onAdd={ouvrirModalExamen}>
            {examens.length === 0 ? (
              <Text style={styles.emptyText}>Aucun examen enregistré.</Text>
            ) : (
              examens.map((e) => (
                <View key={e.id} style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemTitle}>{e.description}</Text>
                    <Tag text={e.type_examen} color="#7c3aed" />
                  </View>
                  {e.resultat && <Text style={styles.listItemSub}>Résultat : {e.resultat}</Text>}
                  <Text style={styles.listItemDate}>{e.date_creation || e.created_at || ''}</Text>
                </View>
              ))
            )}
          </Section>
        )}
      </ScrollView>

      {/* ── Modales ── */}
      <ConsultModal
        visible={consultModalVisible}
        onClose={() => setConsultModalVisible(false)}
        selectedRdvId={selectedRdvId}
        setSelectedConsultationId={setSelectedConsultationId}
        fetchDossier={fetchDossier}
      />
      <OrdoModal
        visible={ordoModalVisible}
        onClose={() => setOrdoModalVisible(false)}
        selectedConsultationId={selectedConsultationId}
        fetchDossier={fetchDossier}
      />
      <ExamenModal
        visible={examenModalVisible}
        onClose={() => setExamenModalVisible(false)}
        selectedPatientId={selectedPatientId}
        fetchDossier={fetchDossier}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 4,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#dc2626' },
  tabText: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#dc2626', fontWeight: '700' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  errorText: { marginTop: 12, color: '#374151', fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#dc2626', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  content: { flex: 1, padding: 16 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionContent: { gap: 8 },

  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 4 },
  addBtnText: { fontSize: 12, fontWeight: '600' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 },

  listItem: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  listItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  listItemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
  listItemSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  listItemDate: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  emptyText: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },

  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  tagText: { fontSize: 11, fontWeight: '600' },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBoite: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitre: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalCorps: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#f9fafb', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },

  fieldWrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },

  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#f9fafb' },
  typeBtnActive: { borderColor: '#7c3aed', backgroundColor: '#ede9fe' },
  typeBtnText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  typeBtnTextActive: { color: '#7c3aed' },

  boutonPrincipal: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  boutonPrincipalText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  boutonDesactive: { opacity: 0.6 },
  boutonAnnuler: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  boutonAnnulerText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },

  fileBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#dc2626', borderStyle: 'dashed', borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: '#fef2f2' },
  fileBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '500', flex: 1 },

  ordoAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6, alignSelf: 'flex-start' },
});