// ============================================================
// components/shared/DoctorDetailView.jsx
// ------------------------------------------------------------
// Vue complète du profil d'un médecin.
// Affichée quand le patient clique sur "Voir le profil".
//
// Contient :
//   - Header coloré avec avatar, nom, stats simulées
//   - Bloc d'informations (centre, téléphone, email)
//   - Grille de créneaux disponibles (sélectionnables)
//   - Barre de booking fixe en bas
// ============================================================

import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, Mail } from 'lucide-react';
import { avatarColor, getInitials, JOURS_SEMAINE } from '../../constants/index.js';
import { getDisponibilites } from '../../api.js';

/**
 * @param {object}   doctor  - Données du médecin (depuis l'API)
 * @param {Function} onBack  - Retour à la liste
 * @param {Function} onBook  - (doctor, dispo) → aller au formulaire
 */
export default function DoctorDetailView({ doctor, onBack, onBook }) {
  const [dispos, setDispos]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDispo, setSelectedDispo] = useState(null);

  // Chargement des disponibilités du médecin via l'API
  useEffect(() => {
    getDisponibilites({ medecin: doctor.id })
      .then(d => {
        const list = Array.isArray(d) ? d : d.results ?? [];
        setDispos(list);
        // Sélectionne le premier créneau par défaut
        if (list.length) setSelectedDispo(list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [doctor.id]);

  // Tri des créneaux dans l'ordre naturel de la semaine
  const sortedDispos = [...dispos].sort(
    (a, b) =>
      JOURS_SEMAINE.indexOf(a.jour?.toLowerCase()) -
      JOURS_SEMAINE.indexOf(b.jour?.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 overflow-y-auto pb-28">

      {/* ── Header coloré selon l'ID du médecin ── */}
      <div
        className="relative p-6 pb-8 flex flex-col items-center text-center"
        style={{ backgroundColor: avatarColor(doctor.id) }}
      >
        {/* Bouton retour */}
        <button
          onClick={onBack}
          className="absolute top-5 left-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Grand avatar */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-extrabold text-4xl border-4 border-white/30 mt-6 shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          {getInitials(doctor.prenom, doctor.nom)}
        </div>

        <h2 className="text-xl font-extrabold text-white mt-3">
          Dr {doctor.prenom} {doctor.nom}
        </h2>
        <span className="text-white/80 text-sm font-semibold">{doctor.specialite}</span>

        {/* Stats simulées (note, patients, expérience) */}
        <div className="flex gap-4 mt-4">
          {[
            { v: '4.8',   l: 'Note' },
            { v: '1.2k+', l: 'Patients' },
            { v: `${Math.floor(Math.random() * 10) + 5}`, l: 'Ans exp.' },
          ].map(s => (
            <div key={s.l} className="bg-white/20 rounded-2xl px-4 py-2 text-center">
              <p className="text-white font-extrabold text-sm">{s.v}</p>
              <p className="text-white/75 text-[10px] font-semibold">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Corps de la page ── */}
      <div className="p-5 space-y-5">

        {/* Bloc informations du médecin */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/50 shadow-sm space-y-4">
          <h3 className="font-extrabold text-neutral-900 text-base">Informations</h3>
          {[
            { icon: MapPin, label: 'Centre de santé', value: doctor.centre_detail?.nom, sub: doctor.centre_detail?.adresse },
            { icon: Phone,  label: 'Téléphone',       value: doctor.telephone },
            { icon: Mail,   label: 'Email',            value: doctor.email },
          ].map(info => (
            <div key={info.label} className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0078FF] shrink-0">
                <info.icon size={18} />
              </span>
              <div>
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wide">{info.label}</p>
                <p className="font-bold text-neutral-800 text-sm">{info.value || '—'}</p>
                {info.sub && <p className="text-xs text-neutral-500 mt-0.5">{info.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Grille de créneaux disponibles */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/50 shadow-sm">
          <h3 className="font-extrabold text-neutral-900 text-base mb-4">Créneaux disponibles</h3>

          {loading ? (
            <p className="text-neutral-400 text-sm text-center py-4">Chargement...</p>
          ) : sortedDispos.length === 0 ? (
            <p className="text-neutral-400 text-sm italic text-center py-4">
              Aucun créneau enregistré.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sortedDispos.map(d => {
                const isSelected = selectedDispo?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDispo(d)}
                    className={`rounded-2xl p-3 text-center border-2 transition-all ${
                      isSelected
                        ? 'border-[#0078FF] bg-blue-50'
                        : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                    }`}
                  >
                    {/* Abréviation du jour (LUN, MAR...) */}
                    <p className={`text-[10px] font-extrabold uppercase tracking-wide ${isSelected ? 'text-[#0078FF]' : 'text-neutral-400'}`}>
                      {d.jour?.slice(0, 3).toUpperCase()}
                    </p>
                    {/* Heure de début */}
                    <p className={`text-sm font-extrabold mt-0.5 ${isSelected ? 'text-[#0078FF]' : 'text-neutral-800'}`}>
                      {d.heure_debut?.slice(0, 5)}
                    </p>
                    {/* Heure de fin */}
                    <p className={`text-[9px] mt-0.5 ${isSelected ? 'text-[#0078FF]/70' : 'text-neutral-400'}`}>
                      → {d.heure_fin?.slice(0, 5)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Barre de booking fixe en bas ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-neutral-100 p-4 shadow-xl z-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-neutral-400 font-medium">Tarif consultation</p>
            <p className="text-lg font-extrabold text-neutral-900">
              12 000 FCFA{' '}
              <span className="text-xs font-semibold text-emerald-600">· AMO -70%</span>
            </p>
          </div>
          {/* Créneau sélectionné affiché en badge */}
          {selectedDispo && (
            <span className="text-xs font-bold text-[#0078FF] bg-blue-50 px-3 py-1.5 rounded-xl">
              {selectedDispo.jour?.slice(0, 3)} · {selectedDispo.heure_debut?.slice(0, 5)}
            </span>
          )}
        </div>
        <button
          onClick={() => selectedDispo && onBook(doctor, selectedDispo)}
          disabled={!selectedDispo}
          className={`w-full py-3.5 font-extrabold text-sm rounded-2xl text-white transition-all shadow-lg ${
            selectedDispo
              ? 'bg-gradient-to-b from-[#0088FF] to-[#007BFF] hover:opacity-95'
              : 'bg-neutral-300 cursor-not-allowed'
          }`}
        >
          {selectedDispo ? '📅 Prendre rendez-vous' : 'Sélectionnez un créneau'}
        </button>
      </div>
    </div>
  );
}
