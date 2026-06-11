// ============================================================
// components/patient/BottomNav.jsx
// ------------------------------------------------------------
// Barre de navigation fixe en bas de l'écran patient.
// Affiche 5 onglets avec icône emoji + label.
// L'onglet actif est mis en évidence en bleu.
// ============================================================

/**
 * @param {string}   activeTab  - Clé de l'onglet actuellement actif
 * @param {Function} setActiveTab - Change l'onglet actif
 */
export default function BottomNav({ activeTab, setActiveTab }) {
  // Définition des 5 onglets
  const TABS = [
    { key: 'home',     icon: '🏠', label: 'Accueil' },
    { key: 'doctors',  icon: '👨‍⚕️', label: 'Médecins' },
    { key: 'hospitals',icon: '🏥', label: 'Centres' },
    { key: 'aihealth', icon: '🤖', label: 'IA Santé' },
    { key: 'profile',  icon: '👤', label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-neutral-100 flex items-center justify-around px-2 h-[72px] z-50 shadow-lg">
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
              isActive ? 'bg-blue-50 text-[#0078FF]' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {/* Icône avec légère mise à l'échelle si actif */}
            <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
              {tab.icon}
            </span>
            {/* Label de l'onglet */}
            <span className={`text-[10px] font-bold ${isActive ? 'text-[#0078FF]' : 'text-neutral-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
