// ============================================================
// constants/index.js
// ------------------------------------------------------------
// Toutes les constantes partagées dans l'application.
// Centraliser ici évite de répéter les mêmes valeurs dans
// plusieurs fichiers et facilite les modifications globales.
// ============================================================

// ── Couleurs des avatars médecins ────────────────────────────
// Chaque médecin reçoit une couleur unique basée sur son ID.
// On utilise le modulo (%) pour cycler sur ces 7 couleurs.
export const AVATAR_COLORS = [
  '#0066CC', // bleu médical
  '#7C3AED', // violet
  '#059669', // vert
  '#DC2626', // rouge
  '#D97706', // orange
  '#0284C7', // bleu ciel
  '#DB2777', // rose
];

/**
 * Retourne la couleur d'avatar correspondant à un ID médecin.
 * @param {number|string} id - L'ID du médecin
 * @returns {string} - Code couleur hexadécimal
 */
export const avatarColor = (id) =>
  AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];

/**
 * Génère les initiales d'un médecin à partir de son prénom et nom.
 * Ex: "Moussa Traoré" → "MT"
 * @param {string} prenom
 * @param {string} nom
 * @returns {string} - 2 lettres majuscules
 */
export const getInitials = (prenom = '', nom = '') =>
  `${prenom.trim()[0] || 'D'}${nom.trim()[0] || 'R'}`.toUpperCase();

// ── Paramètres financiers AMO ────────────────────────────────
// AMO = Assurance Maladie Obligatoire (système malien)
// Taux de remboursement : 70% des frais pris en charge
export const AMO_RATE = 0.70;

// Tarif de consultation standard en FCFA (Franc CFA)
export const CONSULTATION_FEE = 12000;

// ── Filtres de spécialités ───────────────────────────────────
// Utilisés dans l'onglet "Médecins" pour filtrer la liste.
// Chaque entrée définit la clé API, le label affiché,
// et les classes Tailwind pour l'état actif/inactif.
export const SPECIALTY_FILTERS = [
  {
    key: '',
    label: 'Tous',
    color: 'bg-neutral-100 text-neutral-600',
    active: 'bg-neutral-800 text-white',
  },
  {
    key: 'Cardiologue',
    label: 'Cardiologie',
    color: 'bg-blue-50 text-blue-600 border border-blue-200',
    active: 'bg-blue-600 text-white',
  },
  {
    key: 'Pédiatre',
    label: 'Pédiatrie',
    color: 'bg-orange-50 text-orange-600 border border-orange-200',
    active: 'bg-orange-500 text-white',
  },
  {
    key: 'Dentiste',
    label: 'Dentiste',
    color: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
    active: 'bg-cyan-600 text-white',
  },
  {
    key: 'Neurologue',
    label: 'Neurologie',
    color: 'bg-purple-50 text-purple-600 border border-purple-200',
    active: 'bg-purple-600 text-white',
  },
  {
    key: 'Généraliste',
    label: 'Généraliste',
    color: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    active: 'bg-emerald-600 text-white',
  },
];

// ── Ordre des jours de la semaine ────────────────────────────
// Utilisé pour trier les disponibilités et le planning.
export const JOURS_SEMAINE = [
  'lundi', 'mardi', 'mercredi', 'jeudi',
  'vendredi', 'samedi', 'dimanche',
];

// ── Messages initiaux du chat IA ─────────────────────────────
// Ces messages s'affichent dès l'ouverture du chat
// pour simuler une conversation déjà commencée.
export const CHAT_INIT = [
  {
    id: 'm1',
    text: "Bonjour ! J'ai un léger mal de tête persistant.",
    sender: 'user',
    time: '23:51',
  },
  {
    id: 'm2',
    text: "Je suis navrée d'entendre cela. Pourriez-vous me préciser si la douleur est localisée ou diffuse ?",
    sender: 'ai',
    time: '23:52',
  },
];

// ── Données de démonstration : RDV médecin ───────────────────
// Ces RDV fictifs permettent de tester le dashboard médecin
// sans avoir à créer de vrais rendez-vous via le frontend.
export const DEMO_RDV = [
  {
    id: 'rdv-1',
    patientNom: 'Awa Diarra',
    patientTel: '+223 76 54 32 10',
    motif: 'Douleur thoracique',
    dispo: { jour: 'lundi', heure_debut: '08:00:00', heure_fin: '09:00:00' },
    status: 'en_attente',
    amo: 'AMO-4592-74B',
    fee: CONSULTATION_FEE,
    total: Math.round(CONSULTATION_FEE * 0.3),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rdv-2',
    patientNom: 'Boubacar Coulibaly',
    patientTel: '+223 65 43 21 09',
    motif: 'Consultation de suivi',
    dispo: { jour: 'mercredi', heure_debut: '10:00:00', heure_fin: '11:00:00' },
    status: 'accepte',
    amo: null,
    fee: CONSULTATION_FEE,
    total: CONSULTATION_FEE,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'rdv-3',
    patientNom: 'Fatoumata Sanogo',
    patientTel: '+223 77 12 34 56',
    motif: 'Bilan cardiaque annuel',
    dispo: { jour: 'vendredi', heure_debut: '14:00:00', heure_fin: '15:00:00' },
    status: 'en_attente',
    amo: 'AMO-7821-KL',
    fee: CONSULTATION_FEE,
    total: Math.round(CONSULTATION_FEE * 0.3),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'rdv-4',
    patientNom: 'Moussa Keïta',
    patientTel: '+223 69 87 65 43',
    motif: 'Essoufflement inhabituel',
    dispo: { jour: 'jeudi', heure_debut: '09:00:00', heure_fin: '10:00:00' },
    status: 'refuse',
    amo: null,
    fee: CONSULTATION_FEE,
    total: CONSULTATION_FEE,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];
