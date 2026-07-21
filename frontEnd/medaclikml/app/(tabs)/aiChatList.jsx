import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

const STORAGE_KEY = 'ai_conversations';

export default function AiChatList() {
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const list = data ? JSON.parse(data) : [];
      // Trier par date, plus récent en premier
      list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setConversations(list);
    } catch (error) {
      console.log('Erreur chargement conversations:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const creerNouvelleConversation = async () => {
    const nouvelleConv = {
      id: Date.now().toString(),
      titre: 'Nouvelle conversation',
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const list = data ? JSON.parse(data) : [];
    list.push(nouvelleConv);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    router.push({ pathname: '/aiChat', params: { conversationId: nouvelleConv.id } });
  };

  const supprimerConversation = async (id) => {
    Alert.alert(
      'Supprimer la conversation',
      'Voulez-vous vraiment supprimer cette conversation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            let list = data ? JSON.parse(data) : [];
            list = list.filter((c) => c.id !== id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            loadConversations();
          },
        },
      ]
    );
  };

  const formaterDate = (dateStr) => {
    const date = new Date(dateStr);
    const maintenant = new Date();
    const diffMs = maintenant - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffJours = Math.floor(diffH / 24);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH} h`;
    if (diffJours === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  };

  const renderItem = ({ item }) => {
    const dernierMessage = item.messages[item.messages.length - 1];
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => router.push({ pathname: '/aiChat', params: { conversationId: item.id } })}
        onLongPress={() => supprimerConversation(item.id)}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name="medkit" size={24} color="#fff" />
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationTitre} numberOfLines={1}>
            {item.titre}
          </Text>
          <Text style={styles.conversationApercu} numberOfLines={1}>
            {dernierMessage
              ? (dernierMessage.role === 'user' ? 'Vous: ' : 'Assistant: ') + dernierMessage.content
              : 'Aucun message'}
          </Text>
        </View>
        <View style={styles.conversationMeta}>
          <Text style={styles.conversationDate}>{formaterDate(item.updatedAt)}</Text>
          <Ionicons name="chevron-forward" size={18} color="#B0B8C1" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitre}>Assistant Médical IA</Text>
        <Text style={styles.headerSousTitre}>Posez vos questions de santé</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D6F']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitre}>Aucune conversation</Text>
            <Text style={styles.emptyTexte}>
              Démarrez une discussion avec l'assistant médical pour obtenir des réponses fiables à vos questions de santé.
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={creerNouvelleConversation}>
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.fabTexte}>Nouvelle discussion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: '#2E7D6F',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitre: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSousTitre: { fontSize: 14, color: '#D1E8E2', marginTop: 4 },

  conversationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarContainer: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#2E7D6F',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  conversationInfo: { flex: 1 },
  conversationTitre: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  conversationApercu: { fontSize: 13, color: '#64748B', marginTop: 2 },
  conversationMeta: { alignItems: 'flex-end' },
  conversationDate: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitre: { fontSize: 17, fontWeight: '600', color: '#475569', marginTop: 16 },
  emptyTexte: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 24, right: 20, left: 20,
    flexDirection: 'row', backgroundColor: '#2E7D6F',
    borderRadius: 30, paddingVertical: 15, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabTexte: { color: '#fff', fontWeight: '600', fontSize: 15, marginLeft: 8 },
});