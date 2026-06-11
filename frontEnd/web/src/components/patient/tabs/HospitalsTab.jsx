// ============================================================
// components/patient/tabs/HospitalsTab.jsx
// ------------------------------------------------------------
// Onglet "Centres" de l'application patient.
// Affiche une carte interactive simulée avec les centres
// médicaux de Bamako et une grille de sélection rapide.
// ============================================================

import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * @param {Array}    centres        - Liste des centres depuis l'API
 * @param {number}   activeCentreId - ID du centre sélectionné
 * @param {Function} setActiveCentreId
 */
export default function HospitalsTab({ centres, activeCentreId, setActiveCentreId }) {
  // Centre actuellement sélectionné (fallback sur le premier)
  const activeCentre = centres.find(c => c.id === activeCentreId) || centres[0];

  return (
    <motion.div
      key="hospitals"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col bg-white"
    >
      {/* ── Carte interactive simulée ── */}
      {/* Les pins sont positionnés de façon relative pour simuler une carte */}
      <div className="h-64 bg-gradient-to-br from-blue-100 to-blue-300 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
        <div className="text-8xl opacity-30">🗺️</div>
        {/* Un pin par centre, positionné aléatoirement mais visuellement cohérent */}
        {centres.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveCentreId(c.id)}
            className={`absolute p-2 rounded-full shadow-lg transition-transform ${
              activeCentreId === c.id
                ? 'bg-[#0078FF] text-white scale-125 z-20'
                : 'bg-white text-[#0078FF] hover:scale-110 z-10'
            }`}
            style={{
              top:  `${30 + i * 20}%`,
              left: `${25 + i * 25}%`,
            }}
            title={c.nom}
          >
            <MapPin size={18} />
          </button>
        ))}
      </div>

      {/* ── Détails du centre sélectionné ── */}
      <div className="flex-1 p-5 space-y-4">
        <h3 className="text-xl font-bold text-neutral-900">Centres Hospitaliers</h3>

        {/* Carte de détail animée (change à chaque nouveau centre) */}
        {activeCentre && (
          <motion.div
            key={activeCentre.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-neutral-200 p-4 shadow-md flex gap-4"
          >
            {/* Icône hôpital */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0 flex items-center justify-center text-4xl">
              🏥
            </div>
            <div className="flex-grow min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-extrabold text-neutral-900 text-sm truncate">{activeCentre.nom}</h4>
                  <span className="text-[10px] font-bold text-[#0078FF] bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                    {activeCentre.ville}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-semibold mt-1 flex items-center gap-1">
                  <MapPin size={11} />
                  <span className="truncate">{activeCentre.adresse}</span>
                </p>
              </div>
              {/* Badges téléphone + médecins */}
              <div className="flex gap-2 flex-wrap mt-2">
                <span className="text-[9px] font-extrabold text-[#0066FF] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                  📞 {activeCentre.telephone}
                </span>
                {activeCentre.medecins?.length > 0 && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    {activeCentre.medecins.length} médecin(s)
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Grille de sélection rapide ── */}
        <div className="grid grid-cols-3 gap-2">
          {centres.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCentreId(c.id)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                activeCentreId === c.id
                  ? 'bg-blue-50 border-[#0078FF] text-[#0078FF] font-bold shadow-sm'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {/* 2 premiers mots du nom pour économiser l'espace */}
              <span className="text-[10px] block truncate font-bold leading-normal">
                {c.nom.split(' ').slice(0, 2).join(' ')}
              </span>
              <span className="text-[9px] opacity-75 mt-0.5 font-bold leading-none block">
                {c.ville}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
