// ============================================================
// components/doctor/tabs/StatsTab.jsx
// ------------------------------------------------------------
// Onglet "Statistiques" du dashboard médecin.
// Affiche :
//   - 4 compteurs (total, acceptés, en attente, refusés)
//   - Revenus estimés en FCFA (avec/sans AMO)
//   - Barres de taux d'acceptation
//   - Profil médical résumé
// ============================================================

import {
  Calendar, DollarSign, Stethoscope, MapPin, Users,
  CalendarCheck, CalendarX, Clock,
} from 'lucide-react';
import { CONSULTATION_FEE } from '../../../constants/index.js';

/**
 * @param {Array}  appointments  - Tous les RDV
 * @param {object} doctorProfile - Profil du médecin connecté
 */
export default function StatsTab({ appointments, doctorProfile }) {
  // Calcul des métriques
  const rdvAcceptes  = appointments.filter(a => a.status === 'accepte');
  const rdvEnAttente = appointments.filter(a => a.status === 'en_attente');
  const rdvRefuses   = appointments.filter(a => a.status === 'refuse');

  // Revenu total = somme des montants "à régler" des RDV acceptés
  const totalRevenu = rdvAcceptes.reduce((sum, a) => sum + (a.total || 0), 0);

  // Revenus sans AMO (patients qui n'utilisent pas l'assurance)
  const revenuSansAmo = rdvAcceptes
    .filter(a => !a.amo)
    .reduce((sum, a) => sum + (a.total || 0), 0);

  // Revenus avec AMO (30% de 12 000 FCFA = 3 600 FCFA par RDV)
  const revenuAvecAmo = rdvAcceptes
    .filter(a => a.amo)
    .reduce((sum, a) => sum + (a.total || 0), 0);

  return (
    <div className="space-y-5">
      <h3 className="font-extrabold text-neutral-900 text-base">Statistiques</h3>

      {/* ── Grille de compteurs ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total RDV',   value: appointments.length,  icon: Calendar,      color: 'text-[#0078FF]',   bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'Acceptés',    value: rdvAcceptes.length,   icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'En attente',  value: rdvEnAttente.length,  icon: Clock,         color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-100' },
          { label: 'Refusés',     value: rdvRefuses.length,    icon: CalendarX,     color: 'text-red-400',     bg: 'bg-red-50',     border: 'border-red-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-neutral-500 font-bold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Carte revenus ── */}
      <div className="bg-gradient-to-br from-[#0088FF] to-[#0055CC] rounded-3xl p-5 text-white space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-xs font-extrabold text-blue-200 uppercase tracking-widest">
            Revenus estimés
          </p>
          <DollarSign size={20} className="text-blue-200" />
        </div>

        {/* Montant total */}
        <p className="text-3xl font-black">
          {totalRevenu.toLocaleString('fr-FR')}{' '}
          <span className="text-lg font-bold text-blue-200">FCFA</span>
        </p>

        {/* Détail AMO / sans AMO */}
        <div className="border-t border-white/20 pt-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-blue-200">Sans AMO (100%)</span>
            <span className="font-bold">{revenuSansAmo.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-blue-200">Avec AMO (30% patient)</span>
            <span className="font-bold">{revenuAvecAmo.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>

      {/* ── Barres de taux ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
        <p className="text-sm font-extrabold text-neutral-800">Taux d'acceptation</p>
        <div className="space-y-2">
          {[
            { label: 'Acceptés',   count: rdvAcceptes.length,  color: 'bg-emerald-500' },
            { label: 'En attente', count: rdvEnAttente.length, color: 'bg-amber-400' },
            { label: 'Refusés',    count: rdvRefuses.length,   color: 'bg-red-400' },
          ].map(b => {
            // Pourcentage arrondi (0 si aucun RDV)
            const pct = appointments.length
              ? Math.round((b.count / appointments.length) * 100)
              : 0;
            return (
              <div key={b.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500 font-medium">{b.label}</span>
                  <span className="font-bold text-neutral-700">{pct}%</span>
                </div>
                {/* Barre de progression */}
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div
                    className={`${b.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Profil médical résumé ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
        <p className="text-sm font-extrabold text-neutral-800">Mon profil médical</p>
        <div className="space-y-3">
          {[
            { icon: Stethoscope, label: 'Spécialité', value: doctorProfile?.specialite },
            { icon: MapPin,      label: 'Centre',     value: doctorProfile?.centre_detail?.nom },
            { icon: Users,       label: 'Patients vus', value: `${rdvAcceptes.length} accepté(s)` },
          ].map(info => (
            <div key={info.label} className="flex items-center gap-3">
              <info.icon size={16} className="text-[#0078FF]" />
              <div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase">{info.label}</p>
                <p className="text-sm font-bold text-neutral-800">{info.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
