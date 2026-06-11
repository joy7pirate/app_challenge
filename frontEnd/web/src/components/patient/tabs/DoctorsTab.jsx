// ============================================================
// components/patient/tabs/DoctorsTab.jsx
// ------------------------------------------------------------
// Onglet "Médecins" de l'application patient.
// Affiche la liste filtrée des médecins avec :
//   - Barre de recherche textuelle
//   - Chips de filtre par spécialité (scroll horizontal)
//   - Cards médecins avec boutons "Voir profil" et "Réserver"
// ============================================================

import { Search, SlidersHorizontal, MapPin, Star, X } from 'lucide-react';
import { motion } from 'motion/react';
import { avatarColor, getInitials, SPECIALTY_FILTERS } from '../../../constants/index.js';

/**
 * @param {Array}    filteredDoctors  - Médecins filtrés (depuis useAppData)
 * @param {boolean}  loadingMedecins
 * @param {string}   searchQuery
 * @param {Function} setSearchQuery
 * @param {string}   specialtyFilter
 * @param {Function} setSpecialtyFilter
 * @param {Function} goToDoctorDetail  - Navigation vers le profil
 */
export default function DoctorsTab({
  filteredDoctors, loadingMedecins,
  searchQuery, setSearchQuery,
  specialtyFilter, setSpecialtyFilter,
  goToDoctorDetail,
}) {
  return (
    <motion.div
      key="doctors"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="p-5 space-y-5"
    >
      <h2 className="text-2xl font-black text-neutral-900">Spécialistes</h2>

      {/* ── Barre de recherche ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher par nom ou clinique..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-neutral-200 focus:ring-2 focus:ring-[#0078FF] rounded-2xl py-3 pl-11 pr-4 text-sm text-neutral-800 shadow-sm outline-none"
        />
      </div>

      {/* ── Chips de filtre par spécialité ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Bouton effacer les filtres */}
        <button
          onClick={() => { setSpecialtyFilter(''); setSearchQuery(''); }}
          className="flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-bold text-neutral-700 bg-white border border-neutral-200 shrink-0 hover:bg-neutral-50"
        >
          <SlidersHorizontal size={14} /> Effacer
        </button>
        {/* Un chip par spécialité (on saute "Tous" = index 0) */}
        {SPECIALTY_FILTERS.slice(1).map(f => (
          <button
            key={f.key}
            onClick={() => setSpecialtyFilter(specialtyFilter === f.key ? '' : f.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              specialtyFilter === f.key ? f.active : f.color
            }`}
          >
            {f.label}
            {/* Croix pour désactiver le filtre actif */}
            {specialtyFilter === f.key && <X size={12} />}
          </button>
        ))}
      </div>

      {/* ── Liste des médecins ── */}
      <div className="space-y-4">
        {loadingMedecins ? (
          <div className="text-center py-12 text-neutral-400">Chargement des médecins...</div>
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map(doc => (
            <DoctorCard key={doc.id} doc={doc} onDetail={goToDoctorDetail} />
          ))
        ) : (
          /* État vide */
          <div className="text-center py-12 px-4 space-y-3">
            <Search size={32} className="text-neutral-300 mx-auto" />
            <p className="text-neutral-500 text-sm font-semibold">
              Aucun médecin ne correspond.
            </p>
            <button
              onClick={() => { setSpecialtyFilter(''); setSearchQuery(''); }}
              className="px-5 py-2 bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Sous-composant : carte médecin ───────────────────────────

/**
 * Carte affichant les informations d'un médecin dans la liste.
 * @param {object}   doc      - Données du médecin
 * @param {Function} onDetail - Callback pour voir le profil complet
 */
function DoctorCard({ doc, onDetail }) {
  return (
    <div className="bg-white rounded-3xl p-4 border border-neutral-200/50 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Avatar avec initiales colorées */}
        <div
          className="w-[72px] h-[72px] rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-extrabold text-2xl"
          style={{ backgroundColor: avatarColor(doc.id) }}
        >
          {getInitials(doc.prenom, doc.nom)}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-2">
              <h3 className="font-bold text-neutral-900 text-sm truncate">
                Dr {doc.prenom} {doc.nom}
              </h3>
              <p className="text-xs font-semibold text-[#0078FF] mt-0.5">{doc.specialite}</p>
            </div>
            {/* Note simulée */}
            <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-600">4.8</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-neutral-500 text-xs font-medium mt-1">
            <MapPin size={13} className="text-neutral-400" />
            <span className="truncate">{doc.centre_detail?.nom || '—'}</span>
          </div>
        </div>
      </div>
      {/* Boutons d'action */}
      <div className="flex gap-3">
        <button
          onClick={() => onDetail(doc)}
          className="flex-1 py-3 text-xs font-bold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50"
        >
          Voir le Profil
        </button>
        <button
          onClick={() => onDetail(doc)}
          className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-b from-[#0088FF] to-[#007BFF] rounded-xl shadow-sm hover:opacity-95"
        >
          Réserver
        </button>
      </div>
    </div>
  );
}
