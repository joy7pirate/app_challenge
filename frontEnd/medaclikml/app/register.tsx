import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../config/api'; // ⚠️ adaptez le chemin selon votre arborescence

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formattedDateNaissance = dateNaissance
    ? dateNaissance.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const handleRegister = async () => {
    // Validation des champs
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!dateNaissance) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre date de naissance.');
      return;
    }

    setLoading(true);
    try {
      const dateStr = dateNaissance.toISOString().split('T')[0];

      // apiService.register(email, password, telephone, date_naissance)
const response = await apiService.register({
  first_name: firstName,
  last_name: lastName,
  email,
  password,
  telephone,
  date_naissance: dateStr,
  adresse,
});
      // Si votre serializer accepte aussi first_name/last_name/adresse,
      // il faudra étendre apiService.register() côté api.js pour les inclure.
      // Voir remarque plus bas ⬇️

      Alert.alert('Succès', 'Compte créé !');
      router.push('/LoginScreen');
    } catch (error: any) {
      console.log('Erreur register:', error.response?.data || error.message);
      const data = error.response?.data;
      Alert.alert('Erreur', data ? JSON.stringify(data) : 'Connexion impossible au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Créer un compte</Text>

        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Adresse</Text>
        <TextInput
          style={styles.input}
          placeholder="Adresse"
          value={adresse}
          onChangeText={setAdresse}
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder="Téléphone"
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Date de naissance</Text>
        <TouchableOpacity
          style={styles.dateField}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {dateNaissance
              ? formattedDateNaissance
              : 'Sélectionnez votre date de naissance'}
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

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    marginBottom: 6,
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  dateField: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'center',
    minHeight: 48,
  },
  dateText: {
    color: '#333',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    marginTop: 15,
    color: '#007AFF',
    fontSize: 14,
  },
});