import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import EvilIcons from '@expo/vector-icons/EvilIcons';


export default function DoctorCard({ doctor }) {
  return (
    // card container
    <View style={styles.cardContainer}>
        {/* card content high  */}
        <View style={styles.info}>
            {/* avatar */}
            <View style={styles.avatar}></View>
                {/* info text*/}
                <View >
                    <Text style={{ fontSize: 25, fontWeight: "bold" }}>
                        Dr {doctor.prenom} {doctor.nom}
                    </Text>
                    <Text style = {{ fontSize: 18, color: "#3b82f6", fontWeight: "bold" }}>{doctor.specialite}</Text>
                    <View style={styles.infoCenter}>
                        <EvilIcons name="location" size={24} color="grey" />
                        <Text style = {{ fontSize: 18, color: "#6b7280" }}>{doctor.centre_detail?.nom}</Text>
                    </View>
                </View>
        </View>


        <View style={styles.buttonsContainer}>
            <TouchableOpacity style={{ backgroundColor: "#3b82f6", padding: 10, borderRadius: 8, marginTop: 10, flex: 1 }}>
                <Text style={{ color: "#fff", textAlign: "center" }}>Prendre rendez-vous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: "#fff", padding: 10, borderRadius: 8, marginTop: 10, flex: 1 , borderWidth: 1, borderColor:"#006874"}}>
                <Text style={{ color: "#006874", textAlign: "center" }}>Voir le profil</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
}



const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "column",    
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    width: "95%",
    // height: "25%",
    alignSelf: "center",
  },
  avatar: {
    width: 100,
    height: 110,
    borderRadius: 12,
    backgroundColor: "#cbd5e1",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },
  infoCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  buttonsContainer: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
})