import React, { useState } from 'react';
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = "http://192.168.100.81:8000/api";

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      console.log(' Tentative de connexion à:', `${API_URL}/token/`);
      
      // ── Étape 1 : Login avec token JWT ──────────────────
      const res = await axios.post(`${API_URL}/token/`, {
        username: email,
        password: password,
      });

      const accessToken = res.data.access;
      console.log('✅ Token reçu');

      // ── Étape 2 : Sauvegarder le token ──────────────────
      await AsyncStorage.setItem('access_token', accessToken);

      // ── Étape 3 : Récupérer le rôle ─────────────────────
      const profileRes = await axios.get(`${API_URL}/auth/me/`, {
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
      
      // Déterminer le type d'erreur
      let errorMessage = 'Erreur inconnue';
      
      if (e.response) {
        // Réponse du serveur mais erreur
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
        // Pas de réponse du serveur
        console.log('Pas de réponse du serveur');
        errorMessage = `Impossible d'accéder au serveur.\nVérifiez:\n• L'adresse: ${API_URL}\n• Que le serveur est lancé\n• Votre connexion réseau`;
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
