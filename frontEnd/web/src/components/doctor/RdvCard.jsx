// ============================================================
// components/doctor/RdvCard.jsx
// ------------------------------------------------------------
// Carte affichant les informations d'un rendez-vous.
// Utilisée dans RequestsTab et PlanningTab.
//
// Props :
//   rdv         → objet rendez-vous complet
//   showActions → affiche les boutons Accepter/Refuser si true
//   onAccept    → callback pour accepter
//   onRefuse    → callback pour refuser
//   onCancel    → callback pour annuler un RDV accepté
// ============================================================

import { motion } from 'motion/react';
import { Calendar, Stethoscope, DollarSign, Check, X } from 'lucide-react';

/**
 * Badge coloré selon le statut du RDV.
 * Réutilisable dans d'autres composants si besoin.
 */
export function StatusBadge({ status }) {
  // Mapping statut → classes Tailwind
  const styles = {
    en_attente: 'bg-amber-50 text-amber-600 border-amber-200',
    accepte:    'bg-emerald-50 text-emerald-600 border-emerald-200',
    refuse:     'bg-red-50 text-red-500 border-red-200',
  };
  const labels = {
    en_attente: '⏳ En attente',
    accepte:    '✅ Accepté',
    refuse:     '❌ Refusé',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.en_attente}`}>
      {labels[status] || status}
    </span>
  );
}

/**
 * Carte complète d'un rendez-vous.
 */
export default function RdvCard({ rdv, showActions = false, onAccept, onRefuse, onCancel }) {
  return (
    // Animation d'apparition à chaque rendu
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-sm space-y-3"
    >
      {/* ── En-tête : nom patient + statut ── */}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-neutral-900 text-sm">{rdv.patientNom}</p>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">{rdv.patientTel}</p>
        </div>
        <StatusBadge status={rdv.status} />
      </div>

      {/* ── Détails du RDV ── */}
      <div className="bg-neutral-50 rounded-xl p-3 space-y-1.5">
        {/* Créneau horaire */}
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Calendar size={13} className="text-[#0078FF]" />
          <span className="font-semibold capitalize">
            {rdv.dispo?.jour} · {rdv.dispo?.heure_debut?.slice(0, 5)} – {rdv.dispo?.heure_fin?.slice(0, 5)}
          </span>
        </div>
        {/* Motif de consultation */}
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Stethoscope size={13} className="text-[#0078FF]" />
          <span>{rdv.motif}</span>
        </div>
        {/* Montant et AMO */}
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <DollarSign size={13} className="text-emerald-500" />
          <span>
            {rdv.total?.toLocaleString('fr-FR')} FCFA
            {rdv.amo && <span className="text-violet-600 font-bold ml-1">· AMO</span>}
          </span>
        </div>
      </div>

      {/* ── Actions : Accepter / Refuser (RDV en attente) ── */}
      {showActions && rdv.status === 'en_attente' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAccept(rdv.id)}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check size={14} /> Accepter
          </button>
          <button
            onClick={() => onRefuse(rdv.id)}
            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <X size={14} /> Refuser
          </button>
        </div>
      )}

      {/* ── Action : Annuler (RDV déjà accepté) ── */}
      {rdv.status === 'accepte' && (
        <button
          onClick={() => onCancel(rdv.id)}
          className="w-full py-2 bg-neutral-50 hover:bg-red-50 text-neutral-400 hover:text-red-500 border border-neutral-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <X size={13} /> Annuler ce rendez-vous
        </button>
      )}
    </motion.div>
  );
}
