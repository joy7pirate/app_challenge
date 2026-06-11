// ============================================================
// components/doctor/tabs/RequestsTab.jsx
// ------------------------------------------------------------
// Onglet "Demandes" du dashboard médecin.
// Affiche les RDV en 3 sections :
//   1. En attente → boutons Accepter / Refuser
//   2. Acceptés   → bouton Annuler
//   3. Refusés    → lecture seule
// ============================================================

import { CalendarCheck } from 'lucide-react';
import RdvCard from '../RdvCard.jsx';

/**
 * @param {Array}    rdvEnAttente - RDV avec status 'en_attente'
 * @param {Array}    rdvAcceptes  - RDV avec status 'accepte'
 * @param {Array}    rdvRefuses   - RDV avec status 'refuse'
 * @param {Function} onAccept     - (id) → accepter le RDV
 * @param {Function} onRefuse     - (id) → refuser le RDV
 * @param {Function} onCancel     - (id) → annuler un RDV accepté
 */
export default function RequestsTab({
  rdvEnAttente, rdvAcceptes, rdvRefuses,
  onAccept, onRefuse, onCancel,
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-neutral-900 text-base">
        Demandes de rendez-vous
      </h3>

      {/* ── Section : En attente ── */}
      {rdvEnAttente.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-amber-600 font-bold uppercase tracking-wide">
            ⏳ En attente ({rdvEnAttente.length})
          </p>
          {rdvEnAttente.map(rdv => (
            <RdvCard
              key={rdv.id} rdv={rdv}
              showActions={true}
              onAccept={onAccept}
              onRefuse={onRefuse}
              onCancel={onCancel}
            />
          ))}
        </div>
      ) : (
        /* État vide */
        <div className="text-center py-10 space-y-2">
          <CalendarCheck size={36} className="text-neutral-200 mx-auto" />
          <p className="text-neutral-400 text-sm font-semibold">
            Aucune demande en attente
          </p>
        </div>
      )}

      {/* ── Section : Acceptés ── */}
      {rdvAcceptes.length > 0 && (
        <div className="space-y-3 mt-4">
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">
            ✅ Acceptés ({rdvAcceptes.length})
          </p>
          {rdvAcceptes.map(rdv => (
            <RdvCard
              key={rdv.id} rdv={rdv}
              showActions={false}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}

      {/* ── Section : Refusés ── */}
      {rdvRefuses.length > 0 && (
        <div className="space-y-3 mt-4">
          <p className="text-xs text-red-400 font-bold uppercase tracking-wide">
            ❌ Refusés ({rdvRefuses.length})
          </p>
          {rdvRefuses.map(rdv => (
            <RdvCard key={rdv.id} rdv={rdv} showActions={false} />
          ))}
        </div>
      )}
    </div>
  );
}
