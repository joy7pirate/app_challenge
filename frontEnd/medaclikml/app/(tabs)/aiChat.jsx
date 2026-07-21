import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';

const API_URL = 'http://172.20.10.2:8000/api/chatbot/chat/';
const STORAGE_KEY = 'ai_conversations';

const MOTS_URGENCE = [
  'urgence', 'grave', 'danger', 'hôpital', 'immédiat',
  'fatal', 'critique', 'sang', 'inconscient', 'respire pas'
];

export default function AiChat() {
  const params = useLocalSearchParams();
  const [conversationId, setConversationId] = useState(params.conversationId || null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [enChargement, setEnChargement] = useState(false);
  const flatListRef = useRef(null);

  // Si on arrive avec un conversationId (depuis la liste), on charge ses messages
  // Sinon on crée une conversation vide en mémoire (pas encore sauvegardée)
  useEffect(() => {
    if (params.conversationId) {
      chargerConversation(params.conversationId);
    } else {
      // Nouvelle conversation vide
      setConversationId(null);
      setMessages([]);
    }
  }, [params.conversationId]);

  const chargerConversation = async (id) => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const list = data ? JSON.parse(data) : [];
      const conv = list.find((c) => c.id === id);
      if (conv) {
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      }
    } catch (error) {
      console.log('Erreur chargement conversation:', error);
    }
  };

  const sauvegarderConversation = async (nouveauxMessages) => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      let list = data ? JSON.parse(data) : [];

      let idActuel = conversationId;

      if (!idActuel) {
        // Première fois qu'on envoie un message dans cette conversation -> on la crée
        idActuel = Date.now().toString();
        setConversationId(idActuel);
      }

      const titre = nouveauxMessages[0]?.texte?.slice(0, 40) || 'Nouvelle conversation';

      const index = list.findIndex((c) => c.id === idActuel);
      const conversationMaj = {
        id: idActuel,
        titre,
        messages: nouveauxMessages,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        list[index] = conversationMaj;
      } else {
        list.push(conversationMaj);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      console.log('Erreur sauvegarde conversation:', error);
    }
  };

  const detecterUrgence = (texte) => {
    const texteMin = texte.toLowerCase();
    return MOTS_URGENCE.some((mot) => texteMin.includes(mot));
  };

  const envoyerMessage = async () => {
    const contenu = texte.trim();
    if (!contenu || enChargement) return;

    const messageUser = {
      id: Date.now().toString(),
      role: 'user',
      texte: contenu,
      date: new Date().toISOString(),
    };

    const messagesAvecUser = [...messages, messageUser];
    setMessages(messagesAvecUser);
    setTexte('');
    setEnChargement(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const reponse = await axios.post(
        API_URL,
        { message: contenu },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 60000,
        }
      );

      const texteReponse = reponse.data?.response || "Désolé, je n'ai pas pu générer de réponse.";
      const estUrgence = detecterUrgence(texteReponse) || detecterUrgence(contenu);

      const messageIA = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        texte: texteReponse,
        urgence: estUrgence,
        date: new Date().toISOString(),
      };

      const messagesFinal = [...messagesAvecUser, messageIA];
      setMessages(messagesFinal);
      await sauvegarderConversation(messagesFinal);
    } catch (error) {
      console.log('Erreur envoi message:', error);
      const messageErreur = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        texte: "⚠️ Une erreur est survenue. Vérifiez votre connexion et réessayez.",
        erreur: true,
        date: new Date().toISOString(),
      };
      const messagesFinal = [...messagesAvecUser, messageErreur];
      setMessages(messagesFinal);
    } finally {
      setEnChargement(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }) => {
    const estUser = item.role === 'user';
    return (
      <View style={[styles.ligneMessage, estUser ? styles.ligneUser : styles.ligneIA]}>
        {!estUser && (
          <View style={styles.avatarIA}>
            <Ionicons name="medical" size={16} color="#fff" />
          </View>
        )}
        <View
          style={[
            styles.bulle,
            estUser ? styles.bulleUser : styles.bulleIA,
            item.erreur && styles.bulleErreur,
          ]}
        >
          {item.urgence && (
            <View style={styles.alerteUrgence}>
              <Ionicons name="warning" size={14} color="#DC2626" />
              <Text style={styles.alerteTexte}>Situation possiblement urgente</Text>
            </View>
          )}
          <Text style={[styles.messageTexte, estUser && styles.messageTexteUser]}>
            {item.texte}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2E7D6F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitre}>Assistant Médical</Text>
          <Text style={styles.headerStatut}>● En ligne</Text>
        </View>
        <TouchableOpacity
         onPress={() => router.push('/aiChatList')}
          style={styles.historiqueButton}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Ionicons name="medical-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyChatTexte}>
            Posez votre question médicale. Je suis là pour vous aider en m'appuyant sur des
            documents médicaux fiables.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listeMessages}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Indicateur de frappe */}
      {enChargement && (
        <View style={styles.indicateurFrappe}>
          <ActivityIndicator size="small" color="#2E7D6F" />
          <Text style={styles.indicateurTexte}>L'assistant réfléchit...</Text>
        </View>
      )}

      {/* Zone de saisie */}
      <View style={styles.zoneSaisie}>
        <TextInput
          style={styles.input}
          placeholder="Écrivez votre message..."
          placeholderTextColor="#94A3B8"
          value={texte}
          onChangeText={setTexte}
          multiline
        />
        <TouchableOpacity
          style={[styles.boutonEnvoyer, (!texte.trim() || enChargement) && styles.boutonEnvoyerDesactive]}
          onPress={envoyerMessage}
          disabled={!texte.trim() || enChargement}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D6F',
    paddingTop: Platform.OS === 'android' ? 40 : 55, paddingBottom: 14, paddingHorizontal: 12,
  },
  backButton: { padding: 6, marginRight: 6 },
  historiqueButton: { padding: 6 },
  headerTitre: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerStatut: { color: '#D1FAE5', fontSize: 11, marginTop: 2 },

  listeMessages: { padding: 12, paddingBottom: 20 },

  ligneMessage: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
  ligneUser: { alignSelf: 'flex-end' },
  ligneIA: { alignSelf: 'flex-start' },

  avatarIA: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2E7D6F',
    justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 2,
  },

  bulle: { borderRadius: 16, padding: 12, paddingHorizontal: 14 },
  bulleUser: { backgroundColor: '#2E7D6F', borderBottomRightRadius: 4 },
  bulleIA: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bulleErreur: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },

  messageTexte: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  messageTexteUser: { color: '#fff' },

  alerteUrgence: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 8,
  },
  alerteTexte: { color: '#DC2626', fontSize: 11, fontWeight: '700', marginLeft: 4 },

  emptyChat: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyChatTexte: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 12 },

  indicateurFrappe: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8,
  },
  indicateurTexte: { fontSize: 12, color: '#64748B', marginLeft: 8, fontStyle: 'italic' },

  zoneSaisie: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100,
    color: '#1E293B', marginRight: 10,
  },
  boutonEnvoyer: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#2E7D6F',
    justifyContent: 'center', alignItems: 'center',
  },
  boutonEnvoyerDesactive: { backgroundColor: '#A7C4BD' },
});