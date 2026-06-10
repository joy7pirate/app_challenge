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

const API_URL = 'http://192.168.100.81:8000/api';

const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/token/`, {
        username: email,
        password: password,
      });
      await AsyncStorage.setItem('access_token', res.data.access);
      router.replace('/');
    } catch (e) {
      Alert.alert('Erreur', `Identifiants incorrects : ${e}`);
    } finally {
      setLoading(false);
    }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
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
  container: { flex:1, justifyContent:'center', padding:24, backgroundColor:'#f5f5f5' },
  title:     { fontSize:32, fontWeight:'bold', color:'#2563eb', marginBottom:32 },
  input:     { backgroundColor:'#fff', borderRadius:12, padding:16, marginBottom:16, borderWidth:1, borderColor:'#e0e0e0' },
  button:    { backgroundColor:'#2563eb', borderRadius:12, padding:16, alignItems:'center' },
  buttonText:{ color:'#fff', fontSize:16, fontWeight:'bold' },
    link: { textAlign: 'center', marginTop: 15, color: '#007AFF' },

});
