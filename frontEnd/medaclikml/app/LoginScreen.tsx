import React, { useState } from 'react';
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_ENDPOINTS, { api, API_BASE_URL } from '../config/api';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      console.log('🔧 API_BASE_URL utilisée:', API_BASE_URL);
      console.log('Tentative de connexion à:', `${API_BASE_URL}${API_ENDPOINTS.AUTH.TOKEN}`);

      // ── Étape 1 : Login avec token JWT ──────────────────
      const res = await api.post(API_ENDPOINTS.AUTH.TOKEN, {
        username: email,
        password: password,
      });

      const accessToken = res.data.access;
      const refreshToken = res.data.refresh;
      console.log('✅ Token reçu');

      // ── Étape 2 : Sauvegarder les tokens ────────────────
      // ⚠️ IMPORTANT : utiliser les MÊMES clés que dans l'intercepteur (authToken / refreshToken)
      await AsyncStorage.setItem('authToken', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      // Garder aussi 'access_token' si d'autres écrans l'utilisent encore
      await AsyncStorage.setItem('access_token', accessToken);

      // ── Étape 3 : Récupérer le rôle ─────────────────────
      const profileRes = await api.get(API_ENDPOINTS.AUTH.ME, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const role = profileRes.data.role;
      await AsyncStorage.setItem('role', role);
      console.log('✅ Rôle récupéré:', role);

      // ── Étape 4 : Redirection selon le rôle ─────────────
      if (role === 'medecin') {
        router.replace('/medecinPages/dashboardDoc1');
      } else {
        router.replace('/');
      }

    } catch (e) {
      console.log('❌ Erreur complète:', e);

      let errorMessage = 'Erreur inconnue';

      if (e.response) {
        console.log('Code:', e.response.status);
        console.log('Data:', e.response.data);

        if (e.response.status === 401 || e.response.status === 400) {
          errorMessage = 'Identifiants incorrects';
        } else if (e.response.status === 500) {
          errorMessage = 'Erreur serveur (500)';
        } else {
          errorMessage = `Erreur ${e.response.status}: ${e.response.data?.detail || e.response.data?.error || 'Erreur serveur'}`;
        }
      } else if (e.request) {
        console.log('Pas de réponse du serveur');
        errorMessage = `Impossible d'accéder au serveur.\nVérifiez:\n• L'adresse: ${API_BASE_URL}\n• Que le serveur est lancé\n• Votre connexion réseau`;
      } else {
        errorMessage = e.message;
      }

      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Email ou nom d'utilisateur"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Se connecter</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>S'inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex:1, justifyContent:'center', padding:24, backgroundColor:'#f5f5f5' },
  title:      { fontSize:32, fontWeight:'bold', color:'#2563eb', marginBottom:32 },
  input:      { backgroundColor:'#fff', borderRadius:12, padding:16, marginBottom:16, borderWidth:1, borderColor:'#e0e0e0' },
  button:     { backgroundColor:'#2563eb', borderRadius:12, padding:16, alignItems:'center' },
  buttonText: { color:'#fff', fontSize:16, fontWeight:'bold' },
  link:       { textAlign:'center', marginTop:15, color:'#007AFF' },
});