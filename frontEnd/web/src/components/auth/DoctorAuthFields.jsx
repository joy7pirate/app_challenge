// ============================================================
// components/auth/DoctorAuthFields.jsx
// ------------------------------------------------------------
// Champs de formulaire spécifiques à l'authentification médecin.
// Extrait dans un composant séparé pour alléger AuthScreen.jsx.
//
// Différence selon le mode :
//   - 'login'    : message info sobre
//   - 'register' : message avertissement plus détaillé
// ============================================================

import { AlertCircle } from 'lucide-react';

/**
 * Champs nom + email pour l'identification d'un médecin.
 * @param {string} mode - 'login' ou 'register'
 */
export default function DoctorAuthFields({
  doctorNom, setDoctorNom,
  doctorEmail, setDoctorEmail,
  mode = 'login',
}) {
  return (
    <>
      {/* Message d'information contextuel selon le mode */}
      <div className={`border rounded-2xl p-3 flex gap-2 items-start ${
        mode === 'register'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <AlertCircle
          size={16}
          className={`mt-0.5 shrink-0 ${mode === 'register' ? 'text-amber-500' : 'text-blue-500'}`}
        />
        <p className={`text-xs font-medium ${mode === 'register' ? 'text-amber-700' : 'text-blue-700'}`}>
          {mode === 'register'
            ? 'Vous devez être préalablement enregistré par un administrateur. Entrez votre nom et email tels qu\'ils figurent dans le système.'
            : 'Entrez votre nom de famille et email tels qu\'enregistrés dans le système par l\'administrateur.'}
        </p>
      </div>

      {/* Champ nom de famille */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-neutral-700">
          Nom de famille {mode === 'register' && '(tel qu\'enregistré)'}
        </label>
        <input
          required
          value={doctorNom}
          onChange={e => setDoctorNom(e.target.value)}
          placeholder="ex: Traoré"
          className="w-full bg-neutral-100 border-2 border-transparent focus:border-[#0078FF] rounded-xl py-3 px-4 text-sm outline-none transition-all"
        />
      </div>

      {/* Champ email professionnel */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-neutral-700">
          Email professionnel {mode === 'register' && '(tel qu\'enregistré)'}
        </label>
        <input
          type="email"
          required
          value={doctorEmail}
          onChange={e => setDoctorEmail(e.target.value)}
          placeholder="ex: traore@sante.ml"
          className="w-full bg-neutral-100 border-2 border-transparent focus:border-[#0078FF] rounded-xl py-3 px-4 text-sm outline-none transition-all"
        />
      </div>
    </>
  );
}
