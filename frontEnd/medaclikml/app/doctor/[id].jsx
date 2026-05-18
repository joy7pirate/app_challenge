import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { api } from "../../services/api";

// ---------- Constantes & helpers ----------

// Mapping nom du jour (texte) -> index JS (0 = dimanche, 1 = lundi, ...)
const JOUR_TO_INDEX = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
};

// Abréviations affichées dans la carte (style "Mon, Tue...")
const JOUR_ABBR = {
  dimanche: "Sun",
  lundi: "Mon",
  mardi: "Tue",
  mercredi: "Wed",
  jeudi: "Thu",
  vendredi: "Fri",
  samedi: "Sat",
};

// "14:00:00" -> "02:00 PM"
const formatHeure12 = (heure) => {
  if (!heure) return "";
  const [hStr, mStr] = heure.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${period}`;
};

// Renvoie la prochaine date (objet Date) correspondant à un jour de semaine donné
// jourNom = "lundi", "mardi"...
const prochaineDate = (jourNom) => {
  const cible = JOUR_TO_INDEX[jourNom?.toLowerCase()];
  if (cible === undefined) return null;
  const today = new Date();
  const diff = (cible - today.getDay() + 7) % 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
};

// Groupe les disponibilités par jour et trie par date à venir
const grouperParJour = (disponibilites = []) => {
  const groupes = {};
  disponibilites.forEach((d) => {
    const jour = d.jour?.toLowerCase();
    if (!jour || JOUR_TO_INDEX[jour] === undefined) return;
    if (!groupes[jour]) groupes[jour] = [];
    groupes[jour].push(d);
  });

  return Object.keys(groupes)
    .map((jour) => ({
      jour,
      date: prochaineDate(jour),
      creneaux: groupes[jour].sort((a, b) =>
        a.heure_debut.localeCompare(b.heure_debut)
      ),
    }))
    .sort((a, b) => a.date - b.date);
};

// ---------- Composant Available Times ----------

function AvailableTimes({ disponibilites }) {
  const jours = useMemo(() => grouperParJour(disponibilites), [disponibilites]);

  const [selectedJour, setSelectedJour] = useState(
    jours.length > 0 ? jours[0].jour : null
  );
  const [selectedCreneauId, setSelectedCreneauId] = useState(null);

  if (jours.length === 0) {
    return (
      <View style={atStyles.wrapper}>
        <Text style={atStyles.title}>Available Times</Text>
        <Text style={atStyles.empty}>Aucune disponibilité renseignée.</Text>
      </View>
    );
  }

  const jourCourant = jours.find((j) => j.jour === selectedJour) || jours[0];

  return (
    <View style={atStyles.wrapper}>
      <Text style={atStyles.title}>Available Times</Text>

      {/* Sélecteur de jours horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={atStyles.daysRow}
      >
        {jours.map(({ jour, date }) => {
          const isSelected = jour === jourCourant.jour;
          return (
            <TouchableOpacity
              key={jour}
              activeOpacity={0.8}
              style={[atStyles.dayCard, isSelected && atStyles.dayCardActive]}
              onPress={() => {
                setSelectedJour(jour);
                setSelectedCreneauId(null);
              }}
            >
              <Text
                style={[
                  atStyles.dayAbbr,
                  isSelected && atStyles.dayTextActive,
                ]}
              >
                {JOUR_ABBR[jour]}
              </Text>
              <Text
                style={[
                  atStyles.dayNumber,
                  isSelected && atStyles.dayTextActive,
                ]}
              >
                {date ? date.getDate() : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Grille des créneaux 3 colonnes */}
      <View style={atStyles.slotsGrid}>
        {jourCourant.creneaux.map((c) => {
          const isSelected = c.id === selectedCreneauId;
          return (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.8}
              style={[
                atStyles.slot,
                isSelected && atStyles.slotActive,
              ]}
              onPress={() => setSelectedCreneauId(c.id)}
            >
              <Text
                style={[
                  atStyles.slotText,
                  isSelected && atStyles.slotTextActive,
                ]}
              >
                {formatHeure12(c.heure_debut)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ---------- Écran principal ----------

export default function DoctorDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [disponibilites, setDisponibilites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/medecins/${id}/`),
      api.get(`/disponibilites/?medecin=${id}`),
    ])
      .then(([medRes, dispoRes]) => {
        setDoctor(medRes.data);
        setDisponibilites(dispoRes.data.results || dispoRes.data);
      })
      .catch((error) => {
        console.log("Erreur API :", error.response?.data || error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.center}>
        <Text>Médecin introuvable</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Dr ${doctor.prenom} ${doctor.nom}` }} />
      <ScrollView style={styles.container}>
        {/* Hero médecin */}
        <View style={styles.header}>
          <View style={styles.avatar} />
          <Text style={styles.name}>
            Dr {doctor.prenom} {doctor.nom}
          </Text>
          <Text style={styles.specialty}>{doctor.specialite}</Text>
          <View style={styles.locationRow}>
            <EvilIcons name="location" size={22} color="grey" />
            <Text style={styles.location}>{doctor.centre_detail?.nom}</Text>
          </View>
        </View>

        {/* À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.text}>
            {doctor.bio || "Aucune description disponible."}
          </Text>
        </View>

        {/* Available Times */}
        <AvailableTimes disponibilites={disponibilites} />

        {/* Coordonnées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coordonnées</Text>
          {doctor.email && (
            <Text style={styles.text}>Email : {doctor.email}</Text>
          )}
          {doctor.telephone && (
            <Text style={styles.text}>Téléphone : {doctor.telephone}</Text>
          )}
          {doctor.centre_detail?.adresse && (
            <Text style={styles.text}>
              Adresse : {doctor.centre_detail.adresse}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Prendre rendez-vous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

// ---------- Styles "Available Times" ----------

const atStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#F5F7FA",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  daysRow: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 8,
  },
  dayCard: {
    width: 64,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardActive: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
  },
  dayAbbr: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 6,
  },
  dayNumber: {
    fontSize: 22,
    color: "#111827",
    fontWeight: "bold",
  },
  dayTextActive: {
    color: "#fff",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    marginHorizontal: -6,
  },
  slot: {
    width: "33.33%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  slots: {
    width: "31%",
    marginRight: "2%",
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  slotActive: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
  },
  slotText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  slotTextActive: {
    color: "#fff",
  },
  empty: {
    fontSize: 14,
    color: "#6B7280",
  },
});

// ---------- Styles écran ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f1f5f9",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#cbd5e1",
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  specialty: {
    fontSize: 18,
    color: "#3b82f6",
    fontWeight: "bold",
    marginTop: 5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  location: {
    fontSize: 16,
    color: "#6b7280",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  text: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 4,
  },
  buttonsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#0066CC",
    padding: 12,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#006874",
  },
  secondaryBtnText: {
    color: "#006874",
    textAlign: "center",
    fontWeight: "bold",
  },
});
