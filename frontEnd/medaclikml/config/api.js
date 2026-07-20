import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// 1️⃣ DÉTECTION AUTOMATIQUE URL BACKEND
// ============================================

const getApiBaseUrl = () => {
  if (__DEV__) {
    if (Constants.expoConfig?.hostUri) {
      if (Constants.expoConfig.hostUri.includes('10.0.2.2')) {
        return 'http://10.0.2.2:8000/api';
      }
      const hostname = Constants.expoConfig.hostUri.split(':')[0];
      return `http://${hostname}:8000/api`;
    }
  }
  return 'https://api.medaclick.cm/api';
};

export const API_BASE_URL = getApiBaseUrl();

// ============================================
// 2️⃣ INSTANCE AXIOS CENTRALISÉE
// ============================================

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Intercepteur pour ajouter token JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer token expiré
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(
          `${API_BASE_URL}/token/refresh/`,
          { refresh: refreshToken }
        );

        await AsyncStorage.setItem('authToken', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// 3️⃣ ENDPOINTS COMPLETS (Sync Django URLs)
// ============================================

const API_ENDPOINTS = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 AUTHENTIFICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AUTH: {
    TOKEN: '/token/',                    // POST - Obtenir JWT
    REFRESH: '/token/refresh/',          // POST - Refresh token
    REGISTER: '/register/',              // POST - Créer nouveau compte
    LOGIN: '/login/',                    // POST - Login alternatif
    ME: '/auth/me/',                     // GET - Profil utilisateur connecté
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏥 CENTRES MÉDICAUX
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CENTRES: {
    LIST: '/centres/',                   // GET - Liste centres (filtrable: ?ville=)
    DETAIL: (id) => `/centres/${id}/`,   // GET - Détail centre
    CREATE: '/centres/',                 // POST - Créer centre (admin)
    UPDATE: (id) => `/centres/${id}/`,   // PATCH - Modifier centre
    DELETE: (id) => `/centres/${id}/`,   // DELETE - Supprimer centre
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👨‍⚕️ MÉDECINS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MEDECINS: {
    LIST: '/medecins/',                   // GET - Liste médecins (filtrable: ?specialite=, ?centre=)
    DETAIL: (id) => `/medecins/${id}/`,   // GET - Détail médecin
    CREATE: '/medecins/',                 // POST - Créer médecin (admin)
    UPDATE: (id) => `/medecins/${id}/`,   // PATCH - Modifier médecin
    DELETE: (id) => `/medecins/${id}/`,   // DELETE - Supprimer médecin
    DASHBOARD: '/medecin/dashboard/',     // GET - Dashboard médecin connecté
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📅 DISPONIBILITÉS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DISPONIBILITES: {
    LIST: '/disponibilites/',             // GET - Liste disponibilités (filtrable: ?medecin=, ?jour=)
    DETAIL: (id) => `/disponibilites/${id}/`, // GET - Détail disponibilité
    CREATE: '/disponibilites/',           // POST - Créer disponibilité
    UPDATE: (id) => `/disponibilites/${id}/`, // PATCH - Modifier disponibilité
    DELETE: (id) => `/disponibilites/${id}/`, // DELETE - Supprimer disponibilité
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🗓️ RENDEZ-VOUS (APPOINTMENTS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RENDEZVOUS: {
    LIST: '/rendezvous/',                 // GET - Liste tous RDV
    DETAIL: (id) => `/rendezvous/${id}/`, // GET - Détail RDV
    CREATE: '/rendezvous/',               // POST - Créer RDV
    UPDATE: (id) => `/rendezvous/${id}/`, // PATCH - Modifier RDV
    DELETE: (id) => `/rendezvous/${id}/`, // DELETE - Supprimer RDV
    
    // Patient
    PATIENT_LIST: '/rendezvous/patient/', // GET - Mes RDV (patient connecté)
    
    // Médecin
    MEDECIN_LIST: '/rendezvous/medecin/', // GET - RDV du médecin connecté
    CHANGE_STATUS: (rdvId) => `/rendezvous/${rdvId}/statut/`, // PATCH - Changer statut
    
    // Contre-proposition
    RESPOND_COUNTER: (rdvId) => `/rendezvous/${rdvId}/repondre/`, // POST - Répondre contre-proposition
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👥 PATIENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PATIENTS: {
    LIST: '/patients/',                   // GET - Liste patients
    DETAIL: (id) => `/patients/${id}/`,   // GET - Détail patient
    CREATE: '/patients/',                 // POST - Créer patient
    UPDATE: (id) => `/patients/${id}/`,   // PATCH - Modifier patient
    DELETE: (id) => `/patients/${id}/`,   // DELETE - Supprimer patient
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📋 CONSULTATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONSULTATIONS: {
    CREATE: '/consultations/create/',     // POST - Créer consultation
    DETAIL: (id) => `/consultations/${id}/`, // GET - Détail consultation
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💊 ORDONNANCES (PRESCRIPTIONS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ORDONNANCES: {
    CREATE: '/ordonnances/create/',       // POST - Créer ordonnance
    DETAIL: (id) => `/ordonnances/${id}/`, // GET - Détail ordonnance
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧬 EXAMENS (MEDICAL TESTS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXAMENS: {
    CREATE: '/examens/create/',           // POST - Créer examen
    UPDATE_RESULT: (id) => `/examens/${id}/resultat/`, // PATCH - Ajouter résultats
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📑 DOSSIER MÉDICAL (PATIENT MEDICAL FILE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DOSSIER: {
    PATIENT: '/patient/dossier/',         // GET - Dossier patient connecté
    PATIENT_BY_ID: (patientId) => `/medecin/patient/${patientId}/dossier/`, // GET - Dossier patient spécifique (médecin)
  },
};

// ============================================
// 4️⃣ HELPER : Builder d'URL avec filtres
// ============================================

/**
 * Construire URL avec query params
 * @param {string} endpoint - Base endpoint
 * @param {object} params - Query parameters
 * @returns {string} URL complète
 * 
 * Exemples:
 * buildUrl(API_ENDPOINTS.MEDECINS.LIST, { specialite: 'Cardiologue', centre: 1 })
 * buildUrl(API_ENDPOINTS.CENTRES.LIST, { ville: 'Bamako' })
 */
export const buildUrl = (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

// ============================================
// 5️⃣ API SERVICE : Helpers pour requêtes
// ============================================

export const apiService = {
  // 🔐 AUTH
register: (payload) =>
  api.post(API_ENDPOINTS.AUTH.REGISTER, payload),
  login: (email, password) =>
    api.post(API_ENDPOINTS.AUTH.TOKEN, { email, password }),

  getMe: () =>
    api.get(API_ENDPOINTS.AUTH.ME),

  refreshToken: (refreshToken) =>
    api.post(API_ENDPOINTS.AUTH.REFRESH, { refresh: refreshToken }),

  // 🏥 CENTRES
  getCentres: (filters = {}) =>
    api.get(buildUrl(API_ENDPOINTS.CENTRES.LIST, filters)),

  getCentreDetail: (id) =>
    api.get(API_ENDPOINTS.CENTRES.DETAIL(id)),

  // 👨‍⚕️ MÉDECINS
  getMedecins: (filters = {}) =>
    api.get(buildUrl(API_ENDPOINTS.MEDECINS.LIST, filters)),

  getMedecinDetail: (id) =>
    api.get(API_ENDPOINTS.MEDECINS.DETAIL(id)),

  getMedecinDashboard: () =>
    api.get(API_ENDPOINTS.MEDECINS.DASHBOARD),

  // 📅 DISPONIBILITÉS
  getDisponibilites: (filters = {}) =>
    api.get(buildUrl(API_ENDPOINTS.DISPONIBILITES.LIST, filters)),

  getDisponibiliteDetail: (id) =>
    api.get(API_ENDPOINTS.DISPONIBILITES.DETAIL(id)),

  // 🗓️ RENDEZ-VOUS
  createRendezvous: (data) =>
    api.post(API_ENDPOINTS.RENDEZVOUS.CREATE, data),

  getRendezvousDetail: (id) =>
    api.get(API_ENDPOINTS.RENDEZVOUS.DETAIL(id)),

  getMyRendezvous: () =>
    api.get(API_ENDPOINTS.RENDEZVOUS.PATIENT_LIST),

  getMedecinRendezvous: () =>
    api.get(API_ENDPOINTS.RENDEZVOUS.MEDECIN_LIST),

  updateRendezvousStatus: (rdvId, statut) =>
    api.patch(API_ENDPOINTS.RENDEZVOUS.CHANGE_STATUS(rdvId), { statut }),

  respondToCounter: (rdvId, data) =>
    api.post(API_ENDPOINTS.RENDEZVOUS.RESPOND_COUNTER(rdvId), data),

  deleteRendezvous: (id) =>
    api.delete(API_ENDPOINTS.RENDEZVOUS.DELETE(id)),

  // 👥 PATIENTS
  getPatients: () =>
    api.get(API_ENDPOINTS.PATIENTS.LIST),

  getPatientDetail: (id) =>
    api.get(API_ENDPOINTS.PATIENTS.DETAIL(id)),

  updatePatient: (id, data) =>
    api.patch(API_ENDPOINTS.PATIENTS.UPDATE(id), data),

  // 📋 CONSULTATIONS
  createConsultation: (data) =>
    api.post(API_ENDPOINTS.CONSULTATIONS.CREATE, data),

  getConsultationDetail: (id) =>
    api.get(API_ENDPOINTS.CONSULTATIONS.DETAIL(id)),

  // 💊 ORDONNANCES
  createOrdonnance: (data) =>
    api.post(API_ENDPOINTS.ORDONNANCES.CREATE, data),

  getOrdonnanceDetail: (id) =>
    api.get(API_ENDPOINTS.ORDONNANCES.DETAIL(id)),

  // 🧬 EXAMENS
  createExamen: (data) =>
    api.post(API_ENDPOINTS.EXAMENS.CREATE, data),

  updateExamenResult: (id, data) =>
    api.patch(API_ENDPOINTS.EXAMENS.UPDATE_RESULT(id), data),

  // 📑 DOSSIER
  getMyDossier: () =>
    api.get(API_ENDPOINTS.DOSSIER.PATIENT),

  getPatientDossier: (patientId) =>
    api.get(API_ENDPOINTS.DOSSIER.PATIENT_BY_ID(patientId)),
};

export default API_ENDPOINTS;