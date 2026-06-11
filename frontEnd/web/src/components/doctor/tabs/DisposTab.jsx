// ============================================================
// components/doctor/tabs/DisposTab.jsx
// ------------------------------------------------------------
// Onglet "Disponibilités" du dashboard médecin.
// Permet au médecin de :
//   - Voir ses créneaux existants (triés par jour)
//   - Ajouter un nouveau créneau (formulaire inline)
//   - Supprimer un créneau existant
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { JOURS_SEMAINE } from '../../../constants/index.js';

/**
 * @param {Array}    doctorDispos   - Liste des créneaux existants
 * @param {boolean}  showAddDispo   - Formulaire d'ajout visible ?
 * @param {Function} setShowAddDispo
 * @param {string}   newDispoJour   - Jour sélectionné dans le formulaire
 * @param {Function} setNewDispoJour
 * @param {string}   newDispoDebut  - Heure de début
 * @param {Function} setNewDispoDebut
 * @param {string}   newDispoFin    - Heure de fin
 * @param {Function} setNewDispoFin
 * @param {Function} onAdd          - Valider l'ajout
 * @param {Function} onDelete       - (id) → supprimer un créneau
 */
export default function DisposTab({
  doctorDispos,
  showAddDispo, setShowAddDispo,
  newDispoJour, setNewDispoJour,
  newDispoDebut, setNewDispoDebut,
  newDispoFin, setNewDispoFin,
  onAdd, onDelete,
}) {
  // Trie les créneaux dans l'ordre des jours de la semaine
  const sortedDispos = [...doctorDispos].sort(
    (a, b) =>
      JOURS_SEMAINE.indexOf(a.jour?.toLowerCase()) -
      JOURS_SEMAINE.indexOf(b.jour?.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* ── En-tête avec bouton Ajouter ── */}
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-neutral-900 text-base">
          Mes disponibilités
        </h3>
        <button
          onClick={() => setShowAddDispo(!showAddDispo)}
          className="flex items-center gap-1.5 bg-[#0078FF] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#0066DD] transition-colors"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* ── Formulaire d'ajout (animation slide) ── */}
      <AnimatePresence>
        {showAddDispo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <p className="text-xs font-bold text-[#0078FF]">Nouveau créneau</p>

            {/* Sélecteur de jour */}
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">Jour</label>
              <select
                value={newDispoJour}
                onChange={e => setNewDispoJour(e.target.value)}
                className="w-full bg-white border border-blue-200 rounded-xl py-2.5 px-3 text-sm outline-none"
              >
                {JOURS_SEMAINE.map(j => (
                  <option key={j} value={j}>
                    {j.charAt(0).toUpperCase() + j.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Heures début et fin côte à côte */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-neutral-600 block mb-1">
                  Heure début
                </label>
                <input
                  type="time" value={newDispoDebut}
                  onChange={e => setNewDispoDebut(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-xl py-2.5 px-3 text-sm outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-neutral-600 block mb-1">
                  Heure fin
                </label>
                <input
                  type="time" value={newDispoFin}
                  onChange={e => setNewDispoFin(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-xl py-2.5 px-3 text-sm outline-none"
                />
              </div>
            </div>

            {/* Boutons Confirmer / Annuler */}
            <div className="flex gap-2">
              <button
                onClick={onAdd}
                className="flex-1 py-2.5 bg-[#0078FF] text-white text-xs font-bold rounded-xl hover:bg-[#0066DD]"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowAddDispo(false)}
                className="flex-1 py-2.5 bg-white border border-neutral-200 text-neutral-500 text-xs font-bold rounded-xl hover:bg-neutral-50"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Liste des créneaux ── */}
      {sortedDispos.length > 0 ? (
        <div className="space-y-2">
          {sortedDispos.map(d => (
            <div
              key={d.id}
              className="bg-white border border-neutral-200 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm"
            >
              {/* Icône + infos du créneau */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Clock size={16} className="text-[#0078FF]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-800 capitalize">{d.jour}</p>
                  <p className="text-xs text-neutral-400">
                    {d.heure_debut?.slice(0, 5)} – {d.heure_fin?.slice(0, 5)}
                  </p>
                </div>
              </div>

              {/* Bouton supprimer */}
              <button
                onClick={() => onDelete(d.id)}
                className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors border border-red-100"
                title="Supprimer ce créneau"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* État vide */
        <div className="text-center py-10 space-y-2">
          <Clock size={36} className="text-neutral-200 mx-auto" />
          <p className="text-neutral-400 text-sm font-semibold">
            Aucune disponibilité enregistrée
          </p>
          <p className="text-neutral-300 text-xs">
            Cliquez sur "Ajouter" pour créer vos créneaux
          </p>
        </div>
      )}
    </div>
  );
}
