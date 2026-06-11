// ============================================================
// components/patient/tabs/ProfileTab.jsx
// ------------------------------------------------------------
// Onglet "Profil" de l'application patient.
// Affiche :
//   - Carte de profil (avatar, nom, numéro AMO)
//   - Menu accordéon : Rendez-vous / Assurance / Paramètres
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Calendar, ShieldCheck, Settings } from 'lucide-react';

/**
 * @param {object}   patient              - Données du patient connecté
 * @param {Array}    appointments         - Tous les RDV du patient
 * @param {string}   activeProfileSubmenu - Quel sous-menu est ouvert
 * @param {Function} setActiveProfileSubmenu
 * @param {Function} handleLogout
 */
export default function ProfileTab({
  patient, appointments,
  activeProfileSubmenu, setActiveProfileSubmenu,
  handleLogout,
}) {
  // Ne garde que les RDV créés par le patient (ceux qui ont un médecin)
  const patientAppointments = appointments.filter(a => a.doctor);

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="p-5 space-y-5"
    >
      {/* ── Carte de profil ── */}
      <div className="bg-white rounded-[28px] p-5 border border-neutral-200/50 shadow-md relative overflow-hidden flex flex-col items-center text-center">
        {/* Dégradé décoratif en arrière-plan */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-r from-blue-300/10 to-blue-500/10" />
        {/* Avatar avec initiale */}
        <div className="w-20 h-20 rounded-full bg-[#0078FF] flex items-center justify-center text-white text-3xl font-extrabold border-4 border-white shadow-md mt-2 z-10">
          {patient?.name?.[0] || 'A'}
        </div>
        <div className="space-y-1 mt-3">
          <h3 className="text-xl font-bold text-neutral-950">{patient?.name}</h3>
          {/* Numéro AMO affiché en identifiant patient */}
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">
            {patient?.patientId}
          </p>
        </div>
        {/* Stats rapides : prestation AMO + nb RDV */}
        <div className="w-full grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 mt-4">
          <div className="text-center border-r border-neutral-100">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">Prestation</span>
            <span className="text-xs text-[#0078FF] font-bold mt-1 block">AMO</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">Rendez-vous</span>
            <span className="text-xs text-neutral-800 font-black mt-1 block">
              {patientAppointments.length} inscrit(s)
            </span>
          </div>
        </div>
      </div>

      {/* ── Menu accordéon ── */}
      <div className="bg-white rounded-3xl border border-neutral-200/50 shadow-sm divide-y divide-neutral-100 overflow-hidden">
        {[
          { title: 'Mes Rendez-vous',        key: 'appointments', icon: Calendar,    accent: 'text-blue-500 bg-blue-50' },
          { title: "Couverture d'assurance",  key: 'insurance',    icon: ShieldCheck, accent: 'text-emerald-500 bg-emerald-50' },
          { title: 'Paramètres du compte',    key: 'settings',     icon: Settings,    accent: 'text-purple-500 bg-purple-50' },
        ].map(item => (
          <div key={item.key}>
            {/* Ligne cliquable du menu */}
            <button
              onClick={() => setActiveProfileSubmenu(
                activeProfileSubmenu === item.key ? null : item.key
              )}
              className="w-full px-5 py-4 flex justify-between items-center hover:bg-neutral-50 text-left"
            >
              <div className="flex items-center gap-3.5">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.accent}`}>
                  <item.icon size={18} />
                </span>
                <span className="text-sm font-bold text-neutral-800">{item.title}</span>
              </div>
              {/* Flèche rotative selon l'état ouvert/fermé */}
              <ChevronRight
                size={16}
                className={`text-neutral-400 transition-transform ${
                  activeProfileSubmenu === item.key ? 'rotate-90 text-[#0078FF]' : ''
                }`}
              />
            </button>

            {/* Contenu du sous-menu (animation slide) */}
            <AnimatePresence>
              {activeProfileSubmenu === item.key && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-neutral-100 bg-neutral-50/70 overflow-hidden"
                >
                  <div className="p-4 space-y-3 text-xs">
                    {/* ── Sous-menu : Rendez-vous ── */}
                    {item.key === 'appointments' && (
                      patientAppointments.length > 0 ? (
                        patientAppointments.map(apt => (
                          <div key={apt.id} className="bg-white p-3.5 rounded-2xl border border-neutral-200/60 shadow-sm flex justify-between items-center">
                            <div className="space-y-1">
                              <p className="font-bold text-neutral-950 text-sm">
                                Dr {apt.doctor?.prenom} {apt.doctor?.nom}
                              </p>
                              <p className="text-xs font-semibold text-[#0078FF]">{apt.doctor?.specialite}</p>
                              <p className="text-[11px] text-neutral-500">
                                {apt.dispo?.jour} · {apt.dispo?.heure_debut?.slice(0, 5)}
                              </p>
                            </div>
                            {/* Badge de statut */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              apt.status === 'accepte'   ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              apt.status === 'refuse'    ? 'bg-red-50 text-red-500 border-red-200' :
                                                           'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {apt.status === 'accepte' ? 'Accepté' :
                               apt.status === 'refuse'  ? 'Refusé'  : 'En attente'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-neutral-400 text-center py-4">
                          Aucun rendez-vous planifié.
                        </p>
                      )
                    )}

                    {/* ── Sous-menu : Carte AMO ── */}
                    {item.key === 'insurance' && (
                      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl p-4 shadow-md space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] text-emerald-200 uppercase font-black tracking-widest">Carte Tiers-Payant</p>
                            <p className="text-sm font-extrabold mt-1">MedaClick Premium</p>
                          </div>
                          <ShieldCheck size={24} className="text-emerald-200" />
                        </div>
                        <div>
                          <p className="text-[9px] text-emerald-200 uppercase">Identifiant Patient</p>
                          <p className="text-sm font-mono font-bold">{patient?.patientId}</p>
                        </div>
                        <div className="flex justify-between items-end border-t border-emerald-500/30 pt-3">
                          <div>
                            <p className="text-[9px] text-emerald-200 uppercase">Titulaire</p>
                            <p className="text-xs font-bold">{patient?.name}</p>
                          </div>
                          <span className="bg-emerald-500/30 text-emerald-50 border border-emerald-400/30 text-[9px] font-black px-2.5 py-0.5 rounded-full">
                            70% pris en charge
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ── Sous-menu : Paramètres ── */}
                    {item.key === 'settings' && (
                      <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
                        {[
                          { label: 'Nom',       value: patient?.name },
                          { label: 'Email',     value: patient?.email },
                          { label: 'Téléphone', value: patient?.phone },
                        ].map(f => (
                          <div key={f.label}>
                            <p className="text-[10px] font-bold text-neutral-500 uppercase">{f.label}</p>
                            <p className="font-semibold text-neutral-800">{f.value}</p>
                          </div>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100 mt-2"
                        >
                          Se déconnecter
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
