// ============================================================
// components/patient/tabs/HomeTab.jsx
// ------------------------------------------------------------
// Onglet d'accueil de l'application patient.
// Affiche :
//   - Barre de recherche rapide
//   - Grille de spécialités cliquables
//   - Les 3 premiers médecins populaires
//   - Aperçu des centres médicaux
// ============================================================

import { Search, SlidersHorizontal, MapPin, Star, Stethoscope, Activity, Users, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { avatarColor, getInitials } from '../../../constants/index.js';

/**
 * @param {Array}    medecins       - Liste complète des médecins API
 * @param {Array}    centres        - Liste des centres de santé
 * @param {boolean}  loadingMedecins
 * @param {string}   searchQuery
 * @param {Function} setSearchQuery
 * @param {Function} setSpecialtyFilter - Filtre par spécialité
 * @param {Function} setActiveTab       - Navigation vers un autre onglet
 * @param {Function} goToDoctorDetail   - Navigation vers le profil médecin
 */
export default function HomeTab({
  medecins, centres, loadingMedecins,
  searchQuery, setSearchQuery,
  setSpecialtyFilter, setActiveTab,
  goToDoctorDetail,
}) {
  // Spécialités affichées dans la grille d'accueil
  const SPECIALTIES_GRID = [
    { label: 'Cardiologie', icon: Stethoscope, color: 'bg-blue-50 text-blue-600 group-hover:bg-[#0078FF] group-hover:text-white', key: 'Cardiologue' },
    { label: 'Neurologie',  icon: Activity,    color: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white', key: 'Neurologue' },
    { label: 'Pédiatrie',   icon: Users,       color: 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white', key: 'Pédiatre' },
    { label: 'Général',     icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white', key: 'Généraliste' },
    { label: 'Dentiste',    icon: Heart,       color: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white', key: 'Dentiste' },
  ];

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="p-5 space-y-6"
    >
      {/* ── Titre + barre de recherche ── */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-neutral-900 leading-tight">
          Trouvez un médecin<br />facilement
        </h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un médecin, une spécialité..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setActiveTab('doctors'); // bascule sur l'onglet médecins
            }}
            className="w-full bg-white border border-neutral-200 focus:ring-2 focus:ring-[#0078FF] focus:border-transparent rounded-2xl py-4 pl-12 pr-12 text-sm text-neutral-800 placeholder-neutral-400 font-medium shadow-sm outline-none"
          />
          {/* Bouton filtre */}
          <button
            onClick={() => { setSpecialtyFilter(''); setActiveTab('doctors'); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#0078FF] text-white rounded-xl flex items-center justify-center hover:bg-[#0066DD]"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* ── Grille de spécialités ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-neutral-950">Spécialités</h2>
          <button
            onClick={() => { setSpecialtyFilter(''); setActiveTab('doctors'); }}
            className="text-xs font-semibold text-[#0078FF] hover:underline"
          >
            Voir tout
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
          {SPECIALTIES_GRID.map(s => (
            <button
              key={s.key}
              onClick={() => { setSpecialtyFilter(s.key); setActiveTab('doctors'); }}
              className="flex-shrink-0 w-28 bg-white border border-neutral-100 rounded-[20px] p-4 flex flex-col items-center gap-3 shadow-sm hover:-translate-y-1 transition-transform group cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${s.color}`}>
                <s.icon size={26} />
              </div>
              <span className="text-xs font-bold text-neutral-600">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Médecins populaires (3 premiers) ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-neutral-950">Médecins Populaires</h2>
          <button
            onClick={() => { setSpecialtyFilter(''); setActiveTab('doctors'); }}
            className="text-xs font-semibold text-[#0078FF] hover:underline"
          >
            Voir tout
          </button>
        </div>
        <div className="space-y-3.5">
          {loadingMedecins ? (
            <div className="text-center py-8 text-neutral-400 text-sm">Chargement...</div>
          ) : medecins.slice(0, 3).map(doc => (
            <div
              key={doc.id}
              onClick={() => goToDoctorDetail(doc)}
              className="bg-white rounded-3xl p-4 flex gap-4 items-center border border-neutral-200/50 hover:shadow-md transition-shadow cursor-pointer group overflow-hidden relative"
            >
              {/* Effet hover bleu subtil */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-extrabold text-xl"
                style={{ backgroundColor: avatarColor(doc.id) }}
              >
                {getInitials(doc.prenom, doc.nom)}
              </div>
              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-neutral-900 text-sm truncate">Dr {doc.prenom} {doc.nom}</h3>
                  <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-600">4.8</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#0078FF] block mt-0.5">{doc.specialite}</span>
                <div className="flex items-center gap-1 text-neutral-400 text-xs mt-1.5">
                  <MapPin size={12} />
                  <span className="truncate">{doc.centre_detail?.nom || 'Centre non précisé'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Aperçu centres médicaux ── */}
      {centres.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950">Centres Médicaux</h2>
          <div
            onClick={() => setActiveTab('hospitals')}
            className="bg-white border border-neutral-200/50 rounded-3xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden flex items-center justify-center">
              <div className="text-6xl">🗺️</div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0078FF] text-white flex items-center justify-center shadow-lg">
                <MapPin size={14} />
              </div>
            </div>
            <div className="p-3.5">
              <h3 className="font-bold text-neutral-800 text-sm">{centres[0].nom}</h3>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                {centres[0].ville} · {centres[0].adresse}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
