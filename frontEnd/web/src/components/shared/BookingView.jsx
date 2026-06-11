// ============================================================
// components/shared/BookingView.jsx
// ------------------------------------------------------------
// Formulaire de confirmation de rendez-vous.
// Affiché quand le patient choisit un créneau et clique
// sur "Prendre rendez-vous".
//
// Deux états :
//   confirmed = false → formulaire de saisie
//   confirmed = true  → écran de succès
//
// Fonctionnalités :
//   - Résumé du médecin + créneau choisi
//   - Formulaire patient (nom, téléphone, motif)
//   - Module AMO avec toggle et calcul automatique
//   - Récapitulatif des prix en FCFA
// ============================================================

import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import { avatarColor, getInitials, CONSULTATION_FEE, AMO_RATE } from '../../constants/index.js';

/**
 * Vue de réservation.
 * Les props viennent toutes de useAppData via App.jsx.
 */
export default function BookingView({
  doctor, dispo, patient,
  patientNom, setPatientNom,
  patientTel, setPatientTel,
  motif, setMotif,
  useAmo, setUseAmo,
  amoNum, setAmoNum,
  confirmed,
  onConfirm, onBack, onHome,
}) {
  // Calcul du montant AMO et du reste à charge
  const amoReduction = useAmo ? Math.round(CONSULTATION_FEE * AMO_RATE) : 0;
  const total = CONSULTATION_FEE - amoReduction;

  // ════ ÉCRAN DE SUCCÈS ════
  if (confirmed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F8F9FA] text-center space-y-5">
        {/* Animation de la coche verte */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center"
        >
          <CheckCircle size={48} className="text-emerald-500" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900">Rendez-vous envoyé !</h2>
          <p className="text-neutral-500 text-sm">
            Votre demande a été transmise à<br />
            <strong>Dr {doctor.prenom} {doctor.nom}</strong><br />
            {dispo?.jour} · {dispo?.heure_debut?.slice(0, 5)} – {dispo?.heure_fin?.slice(0, 5)}
          </p>
          {/* Message d'attente de confirmation */}
          <p className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
            ⏳ En attente de confirmation du médecin
          </p>
        </div>

        {/* Récapitulatif des frais */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-5 w-full text-left space-y-3 shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Consultation</span>
            <span className="font-bold">{CONSULTATION_FEE.toLocaleString('fr-FR')} FCFA</span>
          </div>
          {useAmo && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600 font-semibold">AMO (-70%)</span>
              <span className="font-bold text-emerald-600">-{amoReduction.toLocaleString('fr-FR')} FCFA</span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold border-t border-neutral-100 pt-3">
            <span>À régler</span>
            <span className="text-[#0078FF]">{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        <button
          onClick={onHome}
          className="w-full py-3.5 bg-gradient-to-b from-[#0088FF] to-[#007BFF] text-white font-extrabold rounded-2xl shadow-lg hover:opacity-95"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // ════ FORMULAIRE DE RÉSERVATION ════
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FA]">
      {/* En-tête avec bouton retour */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-100 px-5 h-14 flex items-center gap-3 z-10">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-extrabold text-neutral-900 text-base">Confirmer le rendez-vous</h2>
      </div>

      <div className="p-5 space-y-5 pb-32">

        {/* ── Résumé du médecin + créneau ── */}
        <div className="bg-white rounded-3xl p-4 border border-neutral-200/50 shadow-sm flex gap-4 items-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl"
            style={{ backgroundColor: avatarColor(doctor.id) }}
          >
            {getInitials(doctor.prenom, doctor.nom)}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-neutral-900">Dr {doctor.prenom} {doctor.nom}</h3>
            <p className="text-xs text-[#0078FF] font-semibold">{doctor.specialite}</p>
            {dispo && (
              <span className="inline-block mt-1 bg-blue-50 text-[#0078FF] text-xs font-bold px-2 py-0.5 rounded-full">
                {dispo.jour} · {dispo.heure_debut?.slice(0, 5)}
              </span>
            )}
            <p className="text-xs text-neutral-400 mt-1">{doctor.centre_detail?.nom}</p>
          </div>
        </div>

        {/* ── Formulaire patient ── */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/50 shadow-sm space-y-4">
          <h3 className="font-extrabold text-neutral-900">Informations patient</h3>
          {[
            { label: 'Nom complet *', value: patientNom, set: setPatientNom, placeholder: 'Votre nom' },
            { label: 'Téléphone *',   value: patientTel, set: setPatientTel, placeholder: '+223 XX XX XX XX' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">{f.label}</label>
              <input
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-neutral-100 border-2 border-transparent focus:border-[#0078FF] rounded-xl py-3 px-4 text-sm outline-none transition-all"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">Motif *</label>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Décrivez brièvement votre motif de visite"
              rows={3}
              className="w-full bg-neutral-100 border-2 border-transparent focus:border-[#0078FF] rounded-xl py-3 px-4 text-sm outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* ── Module AMO ── */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl p-5 border border-violet-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <ShieldCheck size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="font-extrabold text-violet-800 text-sm">Assurance AMO</p>
                <p className="text-[11px] text-violet-600">Prise en charge à 70%</p>
              </div>
            </div>
            {/* Toggle ON/OFF */}
            <button
              onClick={() => setUseAmo(!useAmo)}
              className={`w-12 h-6 rounded-full transition-colors relative ${useAmo ? 'bg-emerald-500' : 'bg-neutral-300'}`}
            >
              {/* Curseur du toggle */}
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useAmo ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {/* Champ numéro AMO (visible uniquement si toggle ON) */}
          {useAmo && (
            <div>
              <label className="text-xs font-semibold text-violet-700 block mb-1">Numéro AMO</label>
              <input
                value={amoNum}
                onChange={e => setAmoNum(e.target.value)}
                placeholder="AMO-XXXX-XXX"
                className="w-full bg-white border-2 border-transparent focus:border-violet-500 rounded-xl py-3 px-4 text-sm outline-none"
              />
            </div>
          )}
        </div>

        {/* ── Récapitulatif des prix ── */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/50 shadow-sm space-y-3">
          <h3 className="font-extrabold text-neutral-900">Récapitulatif</h3>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Consultation</span>
            <span className="font-semibold">{CONSULTATION_FEE.toLocaleString('fr-FR')} FCFA</span>
          </div>
          {useAmo && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600 font-semibold">AMO (-70%)</span>
              <span className="font-bold text-emerald-600">-{amoReduction.toLocaleString('fr-FR')} FCFA</span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold border-t border-neutral-100 pt-3">
            <span>À régler</span>
            <span className="text-[#0078FF] text-lg">{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>

      {/* ── Bouton de confirmation fixe en bas ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-neutral-100 p-4 z-50">
        <button
          onClick={onConfirm}
          className="w-full py-4 bg-gradient-to-b from-[#0088FF] to-[#007BFF] text-white font-extrabold text-sm rounded-2xl shadow-lg hover:opacity-95 transition-opacity"
        >
          Envoyer la demande de rendez-vous ✓
        </button>
      </div>
    </div>
  );
}
