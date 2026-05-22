import { useMemo, useState } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

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

  const handleConfirm = () => {
    if (!prenom.trim() || !nom.trim() || !telephone.trim() || !motif.trim()) {
      Alert.alert("Veuillez remplir tous les champs");
      return;
    }

    const heureDebut = creneau?.heure_debut || "";
    Alert.alert(
      "✅ Rendez-vous confirmé !",
      `Votre RDV avec Dr. ${medecin?.nom || "..."} est confirmé\nle ${jour || "..."} à ${formatHeure24(heureDebut)}.`,
      [
        {
          text: "Retour à l'accueil",
          onPress: () => router.push("/"),
        },
      ]
    );
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

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              value={prenom}
              onChangeText={setPrenom}
              onFocus={() => setFocusedField("prenom")}
              onBlur={() => setFocusedField(null)}
              style={[
                styles.input,
                focusedField === "prenom" && styles.inputFocused,
              ]}
              placeholder="Prénom"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              value={nom}
              onChangeText={setNom}
              onFocus={() => setFocusedField("nom")}
              onBlur={() => setFocusedField(null)}
              style={[
                styles.input,
                focusedField === "nom" && styles.inputFocused,
              ]}
              placeholder="Nom"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              value={telephone}
              onChangeText={setTelephone}
              onFocus={() => setFocusedField("telephone")}
              onBlur={() => setFocusedField(null)}
              style={[
                styles.input,
                focusedField === "telephone" && styles.inputFocused,
              ]}
              placeholder="Téléphone"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Motif de consultation</Text>
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
              placeholder="Décrivez le motif"
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

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={styles.confirmButtonText}>Confirmer le rendez-vous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ color: "#0066CC", textAlign: "center" }}>Modifier ma sélection</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  summaryHeader: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerText: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 12,
  },
  badgeRow: {
    alignSelf: "flex-start",
    backgroundColor: "#E6F0FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    color: "#0066CC",
    fontWeight: "600",
  },
  centerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  centerLocation: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    color: "#111827",
    fontSize: 16,
  },
  inputFocused: {
    borderColor: "#0066CC",
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  summaryCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  summaryEmoji: {
    fontSize: 18,
  },
  summaryText: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: "#0066CC",
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0066CC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
