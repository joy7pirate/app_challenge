// ============================================================
// components/doctor/tabs/PlanningTab.jsx
// ------------------------------------------------------------
// Onglet "Planning" du dashboard médecin.
// Affiche une vue semaine organisée par jour avec :
//   - Les créneaux de disponibilité (bleu)
//   - Les RDV patients planifiés (vert = accepté, orange = attente)
// ============================================================

import { Calendar, Clock } from 'lucide-react';
import { JOURS_SEMAINE } from '../../../constants/index.js';
import { StatusBadge } from '../RdvCard.jsx';

/**
 * @param {Array} appointments  - Tous les RDV (filtrés ici)
 * @param {Array} doctorDispos  - Créneaux de disponibilité
 */
export default function PlanningTab({ appointments, doctorDispos }) {
  // RDV non refusés (on n'affiche pas les annulés dans le planning)
  const rdvActifs = appointments.filter(a => a.status !== 'refuse');

  // Vérifie si la semaine est vide (ni RDV ni dispos)
  const isEmpty = rdvActifs.length === 0 && doctorDispos.length === 0;

  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-neutral-900 text-base">
        Planning de la semaine
      </h3>

      {isEmpty ? (
        /* État vide */
        <div className="text-center py-10 space-y-2">
          <Calendar size={36} className="text-neutral-200 mx-auto" />
          <p className="text-neutral-400 text-sm font-semibold">
            Planning vide cette semaine
          </p>
          <p className="text-neutral-300 text-xs">
            Ajoutez des disponibilités dans l'onglet "Disponibilités"
          </p>
        </div>
      ) : (
        /* Vue par jour */
        JOURS_SEMAINE.map(jour => {
          // RDV de ce jour (comparaison insensible à la casse)
          const rdvDuJour = rdvActifs.filter(
            a => a.dispo?.jour?.toLowerCase() === jour
          );
          // Créneaux de dispo de ce jour
          const disposDuJour = doctorDispos.filter(
            d => d.jour?.toLowerCase() === jour
          );

          // Ne pas afficher les jours sans activité
          if (!rdvDuJour.length && !disposDuJour.length) return null;

          return (
            <div key={jour} className="space-y-2">
              {/* Titre du jour */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0078FF]" />
                <p className="text-xs font-extrabold text-neutral-700 uppercase tracking-wider capitalize">
                  {jour}
                </p>
              </div>

              {/* Créneaux de disponibilité */}
              {disposDuJour.map(d => (
                <div
                  key={d.id}
                  className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-[#0078FF]" />
                    <span className="text-xs font-bold text-[#0078FF]">
                      {d.heure_debut?.slice(0, 5)} – {d.heure_fin?.slice(0, 5)}
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-bold">Disponible</span>
                </div>
              ))}

              {/* RDV patients */}
              {rdvDuJour.map(rdv => (
                <div
                  key={rdv.id}
                  className={`rounded-xl px-3 py-2.5 flex justify-between items-center border ${
                    rdv.status === 'accepte'
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-amber-50 border-amber-100'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-neutral-800">
                      {rdv.patientNom}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {rdv.dispo?.heure_debut?.slice(0, 5)} · {rdv.motif}
                    </p>
                  </div>
                  <StatusBadge status={rdv.status} />
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
