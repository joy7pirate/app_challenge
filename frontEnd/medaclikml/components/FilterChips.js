import { ScrollView, Text, Pressable, StyleSheet } from "react-native";

const specialties = [
  "Tous",
  "cardiologue",
  "Gynécologie",
  "Dentiste",
  "Généraliste",
  "Pédiatre",
  "bling",
];

export default function FilterChips({ selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {specialties.map((item) => {
        const isActive = selected === item;

        return (
          <Pressable
            key={item}
            onPress={() => onSelect(item)}
            style={[styles.chip, isActive && styles.activeChip]}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#d0d7e2",
    backgroundColor: "#fff",
  },
  activeChip: {
    backgroundColor: "#E3F2FD",
    borderColor: "#1E88E5",
  },
  text: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  activeText: {
    color: "#1565C0",
    fontWeight: "700",
  },
});