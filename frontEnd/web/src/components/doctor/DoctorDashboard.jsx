// ============================================================
// components/doctor/DoctorDashboard.jsx
// ------------------------------------------------------------
// Dashboard principal du médecin connecté.
// Orchestre les 4 onglets et affiche le header + stats rapides.
//
// Structure :
//   ┌─────────────────────────────┐
//   │  Header (profil + déco)     │
//   │  Stats rapides (4 compteurs)│
//   │  Barre d'onglets (4 tabs)   │
//   ├─────────────────────────────┤
//   │  Contenu de l'onglet actif  │
//   │  (Demandes / Planning /     │
//   │   Dispos / Stats)           │
//   └─────────────────────────────┘
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { Bell, CalendarCheck, Clock, TrendingUp } from 'lucide-react';
import { avatarColor, getInitials } from '../../constants/index.js';

// Onglets du dashboard
import RequestsTab from './tabs/RequestsTab.jsx';
import PlanningTab from './tabs/PlanningTab.jsx';
import DisposTab   from './tabs/DisposTab.jsx';
import StatsTab    from './tabs/StatsTab.jsx';

/**
 * Dashboard médecin complet.
 * Reçoit toutes les données et handlers depuis App.jsx.
 */
export default function DoctorDashboard({
  doctorProfile,
  appointments,
  doctorDispos,
  doctorTab, setDoctorTab,
  showAddDispo, setShowAddDispo,
  newDispoJour, setNewDispoJour,
  newDispoDebut, setNewDispoDebut,
  newDispoFin, setNewDispoFin,
  handleRdvStatus,
  handleAddDispo,
  handleDeleteDispo,
  handleLogout,
}) {
  // Calcul des compteurs pour l'en-tête et les onglets
  const rdvEnAttente = appointments.filter(a => a.status === 'en_attente');
  const rdvAcceptes  = appointments.filter(a => a.status === 'accepte');
  const rdvRefuses   = appointments.filter(a => a.status === 'refuse');

  // Revenus = somme des montants "à régler" des RDV acceptés
  const totalRevenu  = rdvAcceptes.reduce((sum, a) => sum + (a.total || 0), 0);

  // Handlers spécialisés pour les boutons des cartes RDV
  const onAccept = (id) => handleRdvStatus(id, 'accepte');
  const onRefuse = (id) => handleRdvStatus(id, 'refuse');
  const onCancel = (id) => handleRdvStatus(id, 'refuse'); // annuler = mettre en refusé

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#F8F9FA] flex flex-col shadow-2xl border-x border-neutral-200 overflow-hidden">

        {/* ── Header du dashboard ── */}
        <header className="bg-white border-b border-neutral-100 shadow-sm px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            {/* Avatar + nom + spécialité */}
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg"
                style={{ backgroundColor: avatarColor(doctorProfile.id) }}
              >
                {getInitials(doctorProfile.prenom, doctorProfile.nom)}
              </div>
              <div>
                <p className="font-extrabold text-neutral-900 text-sm">
                  Dr {doctorProfile.prenom} {doctorProfile.nom}
                </p>
                <p className="text-xs text-[#0078FF] font-semibold">
                  {doctorProfile.specialite}
                </p>
              </div>
            </div>
            {/* Bouton déconnexion */}
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-red-400 hover:text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 transition-colors"
            >
              Déconnexion
            </button>
          </div>
          {/* Centre de santé */}
          <p className="text-xs text-neutral-400 mt-2 font-medium">
            🏥 {doctorProfile.centre_detail?.nom} · {doctorProfile.centre_detail?.ville}
          </p>
        </header>

        {/* ── Stats rapides (4 tuiles) ── */}
        <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-white border-b border-neutral-100 shrink-0">
          {[
            { label: 'En attente', value: rdvEnAttente.length,  color: 'text-amber-500',   bg: 'bg-amber-50' },
            { label: 'Acceptés',   value: rdvAcceptes.length,   color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Refusés',    value: rdvRefuses.length,    color: 'text-red-400',     bg: 'bg-red-50' },
            {
              label: 'Revenus',
              // Affiche en "k" si > 0 pour économiser l'espace
              value: totalRevenu > 0 ? `${(totalRevenu / 1000).toFixed(0)}k` : '0',
              color: 'text-[#0078FF]',
              bg: 'bg-blue-50',
            },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-2.5 text-center`}>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-neutral-400 font-bold leading-none mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Barre d'onglets ── */}
        <div className="flex border-b border-neutral-200 bg-white shrink-0 overflow-x-auto no-scrollbar">
          {[
            { key: 'requests', label: 'Demandes',      icon: Bell,         badge: rdvEnAttente.length },
            { key: 'planning', label: 'Planning',      icon: CalendarCheck },
            { key: 'dispos',   label: 'Disponibilités',icon: Clock },
            { key: 'stats',    label: 'Statistiques',  icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setDoctorTab(tab.key)}
              className={`flex-1 min-w-fit px-3 py-3 flex flex-col items-center gap-1 transition-colors relative ${
                doctorTab === tab.key
                  ? 'text-[#0078FF] border-b-2 border-[#0078FF]'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {/* Icône avec badge de notification si besoin */}
              <div className="relative">
                <tab.icon size={18} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Contenu de l'onglet actif ── */}
        <main className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">

            {doctorTab === 'requests' && (
              <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RequestsTab
                  rdvEnAttente={rdvEnAttente}
                  rdvAcceptes={rdvAcceptes}
                  rdvRefuses={rdvRefuses}
                  onAccept={onAccept}
                  onRefuse={onRefuse}
                  onCancel={onCancel}
                />
              </motion.div>
            )}

            {doctorTab === 'planning' && (
              <motion.div key="planning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PlanningTab
                  appointments={appointments}
                  doctorDispos={doctorDispos}
                />
              </motion.div>
            )}

            {doctorTab === 'dispos' && (
              <motion.div key="dispos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DisposTab
                  doctorDispos={doctorDispos}
                  showAddDispo={showAddDispo} setShowAddDispo={setShowAddDispo}
                  newDispoJour={newDispoJour} setNewDispoJour={setNewDispoJour}
                  newDispoDebut={newDispoDebut} setNewDispoDebut={setNewDispoDebut}
                  newDispoFin={newDispoFin} setNewDispoFin={setNewDispoFin}
                  onAdd={handleAddDispo}
                  onDelete={handleDeleteDispo}
                />
              </motion.div>
            )}

            {doctorTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StatsTab
                  appointments={appointments}
                  doctorProfile={doctorProfile}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
