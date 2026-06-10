import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [password, setPassword] = useState('');
  const router = useRouter();
  const formattedDateNaissance = dateNaissance
    ? dateNaissance.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const handleRegister = async () => {
    if (!dateNaissance) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre date de naissance.');
      return;
    }

    try {
      const response = await fetch('http://192.168.100.81:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ 
  first_name: firstName,
  last_name: lastName,
  email, 
  telephone, 
  date_naissance: dateNaissance.toISOString().split('T')[0],
  adresse,
  password 
}),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', 'Compte créé !');
        router.push('/LoginScreen');
      } else {
        Alert.alert('Erreur', JSON.stringify(data));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Connexion impossible au serveur');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      <TextInput
        style={styles.input}
        placeholder="Prénom"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Adresse"
        value={adresse}
        onChangeText={setAdresse}
      />
      <TextInput
        style={styles.input}
        placeholder="Téléphone"
        value={telephone}
        onChangeText={setTelephone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Date de naissance</Text>
      <TouchableOpacity style={styles.dateField} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>
          {dateNaissance ? formattedDateNaissance : 'Sélectionnez votre date de naissance'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dateNaissance || new Date()}
          mode="date"
          maximumDate={new Date()}
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDateNaissance(selectedDate);
            }
          }}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>S'inscrire</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  label: { marginBottom: 8, color: '#333', fontWeight: '600' },
  dateField: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'center',
    minHeight: 48,
  },
  dateText: { color: '#333', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 15, color: '#007AFF' },
});
