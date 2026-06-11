// ============================================================
// hooks/useAppData.js
// ------------------------------------------------------------
// Hook personnalisé qui centralise TOUT l'état (useState) et
// TOUTE la logique métier de l'application.
//
// Pourquoi un hook séparé ?
// → Les composants restent "bêtes" (ils affichent uniquement)
// → La logique est testable et réutilisable
// → App.jsx reste lisible (< 100 lignes)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { getMedecins, getCentres, getDisponibilites } from '../api.js';
import {
  CONSULTATION_FEE, AMO_RATE, CHAT_INIT, DEMO_RDV
} from '../constants/index.js';

/**
 * Hook principal de l'application MedaClick.
 * Retourne tout le state et toutes les fonctions nécessaires
 * aux composants enfants.
 */
export function useAppData() {

  // ── AUTHENTIFICATION ────────────────────────────────────────
  // Détermine si l'utilisateur est connecté et son rôle
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [userRole, setUserRole]         = useState(null);    // 'patient' | 'doctor'
  const [patient, setPatient]           = useState(null);    // données du patient connecté
  const [doctorProfile, setDoctorProfile] = useState(null); // données du médecin connecté

  // Champs du formulaire d'authentification (patient)
  const [authScreen, setAuthScreen]     = useState('register'); // 'login' | 'register'
  const [authEmail, setAuthEmail]       = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName]         = useState('');
  const [authPhone, setAuthPhone]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  // Champs spécifiques au médecin
  const [isDoctor, setIsDoctor]         = useState(false);
  const [doctorEmail, setDoctorEmail]   = useState('');
  const [doctorNom, setDoctorNom]       = useState('');

  // État du processus d'auth
  const [authError, setAuthError]       = useState('');
  const [authLoading, setAuthLoading]   = useState(false);

  // ── NAVIGATION PATIENT ──────────────────────────────────────
  // activeTab : quel onglet est actif dans la barre du bas
  const [activeTab, setActiveTab]       = useState('home');
  // currentView : quelle vue principale est affichée
  // 'main' | 'doctorDetail' | 'confirmBooking'
  const [currentView, setCurrentView]   = useState('main');

  // ── RÉSERVATION ─────────────────────────────────────────────
  const [selectedDoctor, setSelectedDoctor] = useState(null); // médecin sélectionné
  const [selectedDispo, setSelectedDispo]   = useState(null); // créneau sélectionné
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Formulaire de réservation
  const [patientNom, setPatientNom]     = useState('');
  const [patientTel, setPatientTel]     = useState('');
  const [motif, setMotif]               = useState('');
  const [useAmo, setUseAmo]             = useState(true);
  const [amoNum, setAmoNum]             = useState('');

  // ── DONNÉES API ─────────────────────────────────────────────
  const [medecins, setMedecins]         = useState([]);
  const [centres, setCentres]           = useState([]);
  const [loadingMedecins, setLoadingMedecins] = useState(true);

  // ── FILTRES ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  // ── RENDEZ-VOUS (mémoire locale) ────────────────────────────
  // Initialisé avec des données de démo pour tester le dashboard
  const [appointments, setAppointments] = useState(DEMO_RDV);

  // ── DASHBOARD MÉDECIN ───────────────────────────────────────
  const [doctorDispos, setDoctorDispos] = useState([]);      // créneaux du médecin
  const [doctorTab, setDoctorTab]       = useState('requests'); // onglet actif dashboard
  const [showAddDispo, setShowAddDispo] = useState(false);   // formulaire ajout créneau
  const [newDispoJour, setNewDispoJour] = useState('lundi');
  const [newDispoDebut, setNewDispoDebut] = useState('08:00');
  const [newDispoFin, setNewDispoFin]   = useState('12:00');

  // ── CENTRES ─────────────────────────────────────────────────
  const [activeCentreId, setActiveCentreId] = useState(null);
  const [activeProfileSubmenu, setActiveProfileSubmenu] = useState(null);

  // ── CHAT IA ─────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState(CHAT_INIT);
  const [newMessage, setNewMessage]     = useState('');
  const [isAiTyping, setIsAiTyping]     = useState(false);
  const chatEndRef = useRef(null); // référence pour le scroll automatique

  // ══════════════════════════════════════════════════════════
  // EFFETS DE BORD
  // ══════════════════════════════════════════════════════════

  /**
   * Chargement initial des données depuis l'API Django.
   * S'exécute une seule fois au montage du composant ([] vide).
   */
  useEffect(() => {
    // Chargement des médecins
    getMedecins()
      .then(d => {
        // L'API peut retourner soit [] soit { results: [] }
        setMedecins(Array.isArray(d) ? d : d.results ?? []);
        setLoadingMedecins(false);
      })
      .catch(() => setLoadingMedecins(false)); // ne pas bloquer si l'API est down

    // Chargement des centres de santé
    getCentres()
      .then(d => {
        const list = Array.isArray(d) ? d : d.results ?? [];
        setCentres(list);
        // Sélectionner le premier centre par défaut
        if (list.length) setActiveCentreId(list[0].id);
      })
      .catch(() => {});
  }, []);

  /**
   * Scroll automatique vers le bas du chat après chaque message.
   * Se déclenche quand chatMessages ou isAiTyping change.
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  // ══════════════════════════════════════════════════════════
  // FILTRAGE DES MÉDECINS
  // ══════════════════════════════════════════════════════════

  /**
   * Liste filtrée des médecins selon la recherche textuelle
   * et le filtre de spécialité sélectionné.
   * Recalculé automatiquement quand searchQuery ou specialtyFilter change.
   */
  const filteredDoctors = medecins.filter(doc => {
    const q = searchQuery.toLowerCase();

    // Recherche dans nom, prénom, spécialité et nom du centre
    const matchSearch = !q ||
      doc.nom?.toLowerCase().includes(q) ||
      doc.prenom?.toLowerCase().includes(q) ||
      doc.specialite?.toLowerCase().includes(q) ||
      doc.centre_detail?.nom?.toLowerCase().includes(q);

    // Filtre strict par spécialité (vide = tous)
  const matchSpec = !specialtyFilter ||
  doc.specialite?.toLowerCase() === specialtyFilter.toLowerCase();
  });

  // ══════════════════════════════════════════════════════════
  // FONCTIONS D'AUTHENTIFICATION
  // ══════════════════════════════════════════════════════════

  /**
   * Gère la connexion (formulaire login).
   * - Patient : connexion simple avec email/mot de passe (simulée)
   * - Médecin : vérification nom + email contre l'API Django
   */
  const handleLogin = async (e) => {
    // e peut être un vrai événement formulaire ou un objet factice {preventDefault: ()=>{}}
    e?.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (isDoctor) {
      await verifyDoctor();
    } else {
      // Connexion patient simulée (pas de vrai backend auth)
      setPatient({
        name: 'Awa Diarra',
        email: authEmail || 'demo@medaclick.ml',
        phone: '+223 76 54 32 10',
        patientId: 'AMO-4592-74B',
        coverageType: 'Régime AMO Actif (70%)',
      });
      setUserRole('patient');
      setIsLoggedIn(true);
    }
    setAuthLoading(false);
  };

  /**
   * Gère l'inscription (formulaire register).
   * - Patient : crée un profil local avec numéro AMO aléatoire
   * - Médecin : même vérification que la connexion
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (isDoctor) {
      await verifyDoctor();
    } else {
      setPatient({
        name: authName || 'Patient',
        email: authEmail,
        phone: authPhone,
        // Génère un numéro AMO aléatoire pour les nouveaux inscrits
        patientId: 'AMO-' + Math.floor(1000 + Math.random() * 9000) + '-ML',
        coverageType: 'Régime AMO Actif (70%)',
      });
      setUserRole('patient');
      setIsLoggedIn(true);
    }
    setAuthLoading(false);
  };

  /**
   * Vérifie si un médecin existe en base via l'API.
   * Compare nom + email (insensible à la casse) avec tous les médecins.
   * Si trouvé → charge son profil et ses disponibilités → dashboard.
   * Si non trouvé → affiche un message d'erreur.
   */
  const verifyDoctor = async () => {
    try {
      const data = await getMedecins();
      const list = Array.isArray(data) ? data : data.results ?? [];

      // Recherche insensible à la casse
      const found = list.find(m =>
        m.email?.toLowerCase().trim() === doctorEmail.toLowerCase().trim() &&
        m.nom?.toLowerCase().trim() === doctorNom.toLowerCase().trim()
      );

      if (found) {
        // Médecin trouvé → charger ses disponibilités
        const dispos = await getDisponibilites({ medecin: found.id });
        setDoctorDispos(Array.isArray(dispos) ? dispos : dispos.results ?? []);
        setDoctorProfile(found);
        setUserRole('doctor');
        setIsLoggedIn(true);
      } else {
        setAuthError(
          'Aucun médecin trouvé avec ces informations. ' +
          'Vérifiez votre nom et email tels qu\'enregistrés par l\'administrateur.'
        );
      }
    } catch {
      setAuthError('Erreur de connexion. Vérifiez que le serveur Django est démarré.');
    }
  };

  /**
   * Déconnecte l'utilisateur et remet tous les états à zéro.
   */
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setPatient(null);
    setDoctorProfile(null);
    setDoctorDispos([]);
    setAuthEmail(''); setAuthPassword('');
    setAuthName(''); setAuthPhone('');
    setDoctorEmail(''); setDoctorNom('');
    setIsDoctor(false); setAuthError('');
    setActiveTab('home'); setCurrentView('main');
  };

  // ══════════════════════════════════════════════════════════
  // FONCTIONS DE NAVIGATION PATIENT
  // ══════════════════════════════════════════════════════════

  /**
   * Navigue vers le profil détaillé d'un médecin.
   * @param {object} doc - L'objet médecin depuis l'API
   */
  const goToDoctorDetail = (doc) => {
    setSelectedDoctor(doc);
    setSelectedDispo(null); // réinitialise le créneau sélectionné
    setCurrentView('doctorDetail');
  };

  /**
   * Navigue vers le formulaire de confirmation de réservation.
   * Pré-remplit les champs avec les infos du patient connecté.
   * @param {object} doc - Le médecin
   * @param {object} dispo - Le créneau sélectionné
   */
  const goToBooking = (doc, dispo) => {
    setSelectedDoctor(doc);
    setSelectedDispo(dispo);
    setCurrentView('confirmBooking');
    setBookingConfirmed(false);
    // Pré-remplissage avec les infos du patient
    setPatientNom(patient?.name || '');
    setPatientTel(patient?.phone || '');
    setAmoNum(patient?.patientId || '');
    setMotif('');
  };

  /**
   * Confirme la réservation et l'ajoute à la liste locale.
   * Note : dans une vraie app, cela ferait un POST /api/rendezvous/
   */
  const handleConfirmBooking = () => {
    const apt = {
      id: 'apt-' + Date.now(), // ID unique basé sur timestamp
      doctor: selectedDoctor,
      dispo: selectedDispo,
      patientNom, patientTel, motif,
      amo: useAmo ? amoNum : null,
      fee: CONSULTATION_FEE,
      reduction: useAmo ? Math.round(CONSULTATION_FEE * AMO_RATE) : 0,
      total: useAmo
        ? Math.round(CONSULTATION_FEE * (1 - AMO_RATE))
        : CONSULTATION_FEE,
      status: 'en_attente', // le médecin doit encore accepter
      createdAt: new Date().toISOString(),
    };
    // Ajoute en tête de liste (le plus récent en premier)
    setAppointments(prev => [apt, ...prev]);
    setBookingConfirmed(true);
  };

  // ══════════════════════════════════════════════════════════
  // FONCTIONS DU DASHBOARD MÉDECIN
  // ══════════════════════════════════════════════════════════

  /**
   * Change le statut d'un rendez-vous.
   * @param {string} id - L'ID du RDV
   * @param {string} newStatus - 'accepte' | 'refuse' | 'en_attente'
   */
  const handleRdvStatus = (id, newStatus) => {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
    );
  };

  /**
   * Ajoute un nouveau créneau de disponibilité (local uniquement).
   * Note : dans une vraie app, cela ferait un POST /api/disponibilites/
   */
  const handleAddDispo = () => {
    const newDispo = {
      id: 'dispo-' + Date.now(),
      jour: newDispoJour,
      heure_debut: newDispoDebut + ':00', // format HH:MM:SS
      heure_fin: newDispoFin + ':00',
    };
    setDoctorDispos(prev => [...prev, newDispo]);
    // Ferme le formulaire et remet les valeurs par défaut
    setShowAddDispo(false);
    setNewDispoDebut('08:00');
    setNewDispoFin('12:00');
  };

  /**
   * Supprime un créneau de disponibilité.
   * @param {string} id - L'ID du créneau à supprimer
   */
  const handleDeleteDispo = (id) => {
    setDoctorDispos(prev => prev.filter(d => d.id !== id));
  };

  // ══════════════════════════════════════════════════════════
  // FONCTIONS DU CHAT IA
  // ══════════════════════════════════════════════════════════

  /**
   * Envoie un message dans le chat et génère une réponse IA simulée.
   * La réponse est basée sur des mots-clés dans le message.
   * Note : pour une vraie IA, brancher l'API Gemini ici.
   */
  const handleSendChat = () => {
    if (!newMessage.trim()) return;

    // Ajoute le message de l'utilisateur
    const userMsg = {
      id: 'm-' + Date.now(),
      text: newMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setNewMessage('');
    setIsAiTyping(true); // affiche l'animation "en train d'écrire"

    // Simule un délai de réponse de 1.2 secondes
    setTimeout(() => {
      const t = userMsg.text.toLowerCase();

      // Arbre de décision par mots-clés
      let reply = "Merci pour votre message ! Je vous conseille de consulter un de nos spécialistes disponibles sur l'onglet Médecins.";
      if (t.includes('tête') || t.includes('mal'))
        reply = "Un mal de tête peut être lié à la fatigue ou la chaleur de Bamako. Buvez beaucoup d'eau. Si ça persiste, consultez un médecin.";
      else if (t.includes('fièvre'))
        reply = "La fièvre est une réaction naturelle. Si elle dépasse 38.5°C pendant plus de 48h, consultez un médecin rapidement.";
      else if (t.includes('rendez') || t.includes('réserver'))
        reply = "Pour prendre rendez-vous, allez sur l'onglet Médecins, choisissez votre docteur et confirmez.";
      else if (t.includes('amo') || t.includes('assurance'))
        reply = "L'AMO prend en charge 70% des frais. Votre reste à charge est de 30%. Présentez votre numéro AMO lors de la réservation.";
      else if (t.includes('coeur') || t.includes('cardio'))
        reply = "Pour une gêne cardiaque, consultez un cardiologue. Vous en trouverez dans l'onglet Médecins.";

      setChatMessages(prev => [...prev, {
        id: 'm-ai-' + Date.now(),
        text: reply,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setIsAiTyping(false);
    }, 1200);
  };

  // ══════════════════════════════════════════════════════════
  // RETOUR DU HOOK
  // Tout ce dont les composants ont besoin est exposé ici.
  // ══════════════════════════════════════════════════════════
  return {
    // Auth
    isLoggedIn, userRole, patient, doctorProfile,
    authScreen, setAuthScreen,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authName, setAuthName,
    authPhone, setAuthPhone,
    showPassword, setShowPassword,
    termsChecked, setTermsChecked,
    isDoctor, setIsDoctor,
    doctorEmail, setDoctorEmail,
    doctorNom, setDoctorNom,
    authError, setAuthError,
    authLoading,
    handleLogin, handleRegister, handleLogout,

    // Navigation patient
    activeTab, setActiveTab,
    currentView, setCurrentView,
    selectedDoctor, selectedDispo,
    bookingConfirmed,
    goToDoctorDetail, goToBooking, handleConfirmBooking,

    // Formulaire réservation
    patientNom, setPatientNom,
    patientTel, setPatientTel,
    motif, setMotif,
    useAmo, setUseAmo,
    amoNum, setAmoNum,

    // Données API
    medecins, centres, loadingMedecins,
    filteredDoctors,

    // Centres
    activeCentreId, setActiveCentreId,
    activeProfileSubmenu, setActiveProfileSubmenu,

    // Rendez-vous
    appointments,

    // Dashboard médecin
    doctorDispos,
    doctorTab, setDoctorTab,
    showAddDispo, setShowAddDispo,
    newDispoJour, setNewDispoJour,
    newDispoDebut, setNewDispoDebut,
    newDispoFin, setNewDispoFin,
    handleRdvStatus, handleAddDispo, handleDeleteDispo,

    // Chat
    chatMessages, newMessage, setNewMessage,
    isAiTyping, chatEndRef, handleSendChat,
  };
}
