import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { api } from "../../services/api";
import FilterChips from "../../components/FilterChips";
import DoctorCard from "../../components/DoctorCard";

export default function MedecinsScreen() {
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
const [selectedSpecialty, setSelectedSpecialty] = useState("Tous");
useEffect(() => {
  setLoading(true);

  const endpoint =
    selectedSpecialty === "Tous"
      ? "/medecins/"
      : `/medecins/?specialite=${selectedSpecialty}`;

  api
    .get(endpoint)
    .then((response) => {
      setMedecins(response.data.results || response.data);
    })
    .catch((error) => {
      console.log("Erreur API :", error.response?.data || error.message);
    })
    .finally(() => {
      setLoading(false);
    });
}, [selectedSpecialty]);
  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <>
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Médecins disponibles
      </Text>
    <FilterChips
  selected={selectedSpecialty}
  onSelect={setSelectedSpecialty}
/>

    </View>
      <FlatList
        data={medecins}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DoctorCard doctor={item} />
        )}
      />

</>
  );
}