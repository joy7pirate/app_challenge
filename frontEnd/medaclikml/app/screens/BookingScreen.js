import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from "../../config/api";

const formatHeure24 = (heure) => {
  if (!heure) return "";
  const [hStr, mStr] = heure.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  return `${String(h).padStart(2, "0")}:${m}`;
};

const capitalize = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const getNextDateFromDayName = (jour) => {
  if (!jour) return null;
  const mapping = {
    dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
  };
  const normalized = jour.toLowerCase();
  const target = mapping[normalized];
  if (target === undefined) return null;
  const today = new Date();
  const diff = (target - today.getDay() + 7) % 7;
  const d = new Date(today);
  d.setDate(today.getDate() + (diff === 0 ? 7 : diff));
  return d.toISOString().slice(0, 10);
};

const parseParam = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const getInitials = (medecin) => {
  if (!medecin) return "DR";
  const first = medecin.prenom?.trim()?.[0] || "D";
  const last = medecin.nom?.trim()?.[0] || "R";
  return `${first}${last}`.toUpperCase();
};

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const medecin = useMemo(() => parseParam(params.medecin), [params.medecin]);
  const centre = useMemo(() => parseParam(params.centre), [params.centre]);
  const jour = useMemo(() => parseParam(params.jour), [params.jour]);
  const creneau = useMemo(() => parseParam(params.creneau), [params.creneau]);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motif, setMotif] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const [patientId, setPatientId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // 🔵 Charger le profil patient dès l'ouverture de l'écran
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          Alert.alert('Erreur', 'Vous devez être connecté pour prendre un rendez-vous.');
          router.back();
          return;
        }

        const profileRes = await api.get('/auth/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = profileRes.data || {};
        console.log('📦 Profil auth (booking):', profile);

        const idRaw =
          profile.patient?.id ||
          profile.patient_id ||
          profile.id;
        const id = idRaw ? Number(idRaw) : null;

        if (!id || Number.isNaN(id)) {
          throw new Error('Identifiant patient introuvable');
        }
        setPatientId(id);

        // Pré-remplissage nom / prénom / téléphone
        setPrenom(profile.first_name || "");
        setNom(profile.last_name || profile.username?.split('@')[0] || "");
        setTelephone(profile.telephone || "");

        // Si le téléphone n'est pas dans /auth/me/, on va le chercher via /patients/
        if (!profile.telephone) {
          try {
            const patientRes = await api.get('/patients/', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const patientData = patientRes.data;
            if (patientData?.telephone) setTelephone(patientData.telephone);
            if (patientData?.nom) setNom(patientData.nom);
            if (patientData?.prenom) setPrenom(patientData.prenom);
          } catch (err) {
            console.log('⚠️ Impossible de récupérer /patients/ :', err.message);
          }
        }
      } catch (error) {
        console.log('Erreur chargement profil :', error.response?.data || error.message);
        Alert.alert('Erreur', "Impossible de charger votre profil.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleConfirm = async () => {
    if (!motif.trim()) {
      Alert.alert("Veuillez préciser le motif de la consultation");
      return;
    }

    if (!medecin?.id || !centre?.id) {
      Alert.alert("Erreur", "Impossible d'identifier le médecin ou le centre.");
      return;
    }

    if (!patientId) {
      Alert.alert("Erreur", "Impossible d'identifier votre compte patient.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('access_token');

      const normalizedJour = /^\d{4}-\d{2}-\d{2}$/.test(jour)
        ? jour
        : getNextDateFromDayName(jour);
      if (!normalizedJour) {
        throw new Error('Date invalide pour le rendez-vous');
      }

      const payload = {
        medecin: medecin.id,
        centre: centre.id,
        patient: patientId,
        patient_prenom: prenom,
        patient_nom: nom,
        telephone,
        motif,
        jour: normalizedJour,
        heure: creneau?.heure_debut || "",
        heure_fin: creneau?.heure_fin || "",
        statut: "en_attente",
      };

      console.log('Rendez-vous payload:', payload);

      const response = await api.post("/rendezvous/", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('RDV créé:', response.data);

      Alert.alert(
        "✅ Rendez-vous confirmé !",
        `Votre RDV avec Dr. ${medecin?.nom || "..."} est confirmé\nle ${normalizedJour || "..."} à ${formatHeure24(payload.heure)}.`,
        [{ text: "Retour à l'accueil", onPress: () => router.push("/") }]
      );
    } catch (error) {
      console.log("Erreur création RDV :", error.response?.data || error.message);
      Alert.alert(
        "Erreur",
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Impossible de créer le rendez-vous. Ce créneau est peut-être déjà réservé."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!medecin || !centre || !jour || !creneau) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Impossible de charger les détails du rendez-vous.
        </Text>
      </View>
    );
  }

  if (isLoadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={{ marginTop: 12, color: "#6B7280" }}>Chargement de votre profil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(medecin)}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.doctorName}>
              Dr {medecin.prenom} {medecin.nom}
            </Text>
            <Text style={styles.doctorSpecialty}>{medecin.specialite}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>
                {capitalize(jour)} • {formatHeure24(creneau.heure_debut)}
              </Text>
            </View>
            <Text style={styles.centerName}>{centre.nom}</Text>
            <Text style={styles.centerLocation}>{centre.ville || centre.adresse}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations patient</Text>
          <Text style={styles.helperText}>
            Ces informations sont issues de votre profil.
          </Text>

          {/* 🔒 Champs verrouillés, pré-remplis */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prénom</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyText}>{prenom || "-"}</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nom</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyText}>{nom || "-"}</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyText}>{telephone || "Non renseigné"}</Text>
            </View>
          </View>

          {/* ✏️ Seul champ éditable */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Motif de consultation *</Text>
            <TextInput
              value={motif}
              onChangeText={setMotif}
              onFocus={() => setFocusedField("motif")}
              onBlur={() => setFocusedField(null)}
              style={[
                styles.input,
                styles.textarea,
                focusedField === "motif" && styles.inputFocused,
              ]}
              placeholder="Décrivez le motif de votre consultation"
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Récapitulatif RDV</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>📅</Text>
            <Text style={styles.summaryText}>{capitalize(jour)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>🕐</Text>
            <Text style={styles.summaryText}>
              {formatHeure24(creneau.heure_debut)} → {formatHeure24(creneau.heure_fin)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>📍</Text>
            <Text style={styles.summaryText}>
              {centre.nom} · {centre.adresse}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>👨‍⚕️</Text>
            <Text style={styles.summaryText}>
              Dr {medecin.prenom} {medecin.nom} · {medecin.specialite}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmer le rendez-vous</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ color: "#0066CC", textAlign: "center" }}>Modifier ma sélection</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 16, color: "#374151", textAlign: "center" },
  summaryHeader: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12, elevation: 4, flexDirection: "row", gap: 16, alignItems: "center",
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#0066CC",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerText: { flex: 1 },
  doctorName: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  doctorSpecialty: { fontSize: 16, color: "#4B5563", marginBottom: 12 },
  badgeRow: {
    alignSelf: "flex-start", backgroundColor: "#E6F0FF", paddingVertical: 6,
    paddingHorizontal: 12, borderRadius: 999, marginBottom: 10,
  },
  badgeText: { color: "#0066CC", fontWeight: "600" },
  centerName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  centerLocation: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  formSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 8 },
  helperText: { fontSize: 13, color: "#9CA3AF", marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: "#374151", marginBottom: 8, fontWeight: "600" },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0E0E0",
    borderRadius: 12, padding: 14, color: "#111827", fontSize: 16,
  },
  inputFocused: { borderColor: "#0066CC" },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  readonlyField: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
  },
  readonlyText: {
    color: "#6B7280",
    fontSize: 16,
  },
  summaryCard: { backgroundColor: "#F5F7FA", borderRadius: 20, padding: 20, marginBottom: 24 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  summaryEmoji: { fontSize: 18 },
  summaryText: { color: "#374151", fontSize: 16, lineHeight: 22, flex: 1 },
  confirmButton: {
    backgroundColor: "#0066CC", borderRadius: 16, paddingVertical: 16,
    justifyContent: "center", alignItems: "center", shadowColor: "#0066CC",
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});