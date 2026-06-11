// ============================================================
// components/auth/AuthScreen.jsx
// ------------------------------------------------------------
// Écran d'authentification affiché quand l'utilisateur
// n'est pas connecté. Contient deux modes :
//   - 'login'    : connexion avec email + mot de passe
//   - 'register' : inscription avec nom, email, téléphone
//
// Chaque mode supporte deux rôles via un toggle :
//   - Patient  : formulaire standard
//   - Médecin  : vérification nom + email contre l'API Django
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, HelpCircle, ChevronRight, Eye, EyeOff,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import DoctorAuthFields from './DoctorAuthFields.jsx';

/**
 * Écran d'authentification principal.
 * Reçoit tout le state et les handlers depuis useAppData via App.jsx.
 */
export default function AuthScreen({
  // Quel formulaire afficher : 'login' ou 'register'
  authScreen, setAuthScreen,

  // Toggle patient / médecin
  isDoctor, setIsDoctor,

  // Champs patient
  authEmail, setAuthEmail,
  authPassword, setAuthPassword,
  authName, setAuthName,
  authPhone, setAuthPhone,
  showPassword, setShowPassword,
  termsChecked, setTermsChecked,

  // Champs médecin
  doctorEmail, setDoctorEmail,
  doctorNom, setDoctorNom,

  // État du processus
  authError, setAuthError,
  authLoading,

  // Handlers de soumission
  handleLogin,
  handleRegister,

  // Connexion démo (accès rapide sans saisie)
  onDemoLogin,
}) {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md min-h-screen bg-[#F8F9FA] flex flex-col shadow-2xl border-x border-neutral-200">

        {/* ── En-tête avec logo ── */}
        <header className="flex items-center justify-between px-5 h-16 bg-white border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0078FF]">
              <Activity size={24} className="animate-pulse" />
            </span>
            <span className="font-bold text-xl text-[#0078FF]">MedaClick</span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400">
            <HelpCircle size={20} />
          </button>
        </header>

        {/* ── Contenu principal ── */}
        <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">

            {/* ════ FORMULAIRE DE CONNEXION ════ */}
            {authScreen === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-neutral-900">Connexion</h2>
                  <p className="text-neutral-500 text-sm">Accédez à votre espace MedaClick Mali.</p>
                </div>

                {/* Toggle Patient / Médecin */}
                <RoleToggle
                  isDoctor={isDoctor}
                  onToggle={(val) => { setIsDoctor(val); setAuthError(''); }}
                />

                {/* Formulaire */}
                <form onSubmit={handleLogin} className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-lg space-y-4">

                  {isDoctor ? (
                    /* Champs spécifiques au médecin */
                    <DoctorAuthFields
                      doctorNom={doctorNom} setDoctorNom={setDoctorNom}
                      doctorEmail={doctorEmail} setDoctorEmail={setDoctorEmail}
                      mode="login"
                    />
                  ) : (
                    /* Champs patient standard */
                    <>
                      <Field label="Email" type="email" value={authEmail} onChange={setAuthEmail} placeholder="awa.diarra@assurance.ml" />
                      <PasswordField
                        value={authPassword} onChange={setAuthPassword}
                        show={showPassword} onToggle={() => setShowPassword(!showPassword)}
                      />
                    </>
                  )}

                  {/* Message d'erreur */}
                  {authError && <ErrorBox message={authError} />}

                  {/* Bouton de soumission */}
                  <SubmitButton loading={authLoading} label={isDoctor ? 'Accéder au Dashboard' : 'Se connecter'} />
                </form>

                {/* Accès démo (patient uniquement) */}
                {!isDoctor && (
                  <button
                    onClick={onDemoLogin}
                    className="w-full py-3 bg-white border border-neutral-200 rounded-xl font-medium text-sm text-neutral-700 flex items-center justify-center gap-3 hover:bg-neutral-50"
                  >
                    <span className="text-lg">👤</span> Accès Démo Patient
                  </button>
                )}

                <p className="text-center text-sm text-neutral-500">
                  Pas de compte ?{' '}
                  <button
                    onClick={() => { setAuthScreen('register'); setAuthError(''); }}
                    className="text-[#0078FF] font-bold hover:underline"
                  >
                    S'inscrire
                  </button>
                </p>
              </motion.div>
            )}

            {/* ════ FORMULAIRE D'INSCRIPTION ════ */}
            {authScreen === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-neutral-900">Créer un compte</h2>
                  <p className="text-neutral-400 text-xs">Rejoignez MedaClick Mali.</p>
                </div>

                {/* Toggle Patient / Médecin */}
                <RoleToggle
                  isDoctor={isDoctor}
                  onToggle={(val) => { setIsDoctor(val); setAuthError(''); }}
                  registerMode
                />

                <form onSubmit={handleRegister} className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-lg space-y-4">

                  {isDoctor ? (
                    <DoctorAuthFields
                      doctorNom={doctorNom} setDoctorNom={setDoctorNom}
                      doctorEmail={doctorEmail} setDoctorEmail={setDoctorEmail}
                      mode="register"
                    />
                  ) : (
                    <>
                      <Field label="Nom Complet" type="text" value={authName} onChange={setAuthName} placeholder="Awa Diarra" />
                      <Field label="Email" type="email" value={authEmail} onChange={setAuthEmail} placeholder="awa.diarra@assurance.ml" />
                      <Field label="Téléphone (Mali)" type="tel" value={authPhone} onChange={setAuthPhone} placeholder="+223 76 54 32 10" />
                      <Field label="Mot de Passe" type="password" value={authPassword} onChange={setAuthPassword} placeholder="••••••••" />
                      {/* Case à cocher CGU */}
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox" id="terms"
                          checked={termsChecked}
                          onChange={e => setTermsChecked(e.target.checked)}
                          className="mt-1"
                        />
                        <label htmlFor="terms" className="text-xs text-neutral-500">
                          J'accepte les <span className="text-[#0078FF]">Conditions d'Utilisation</span>
                        </label>
                      </div>
                    </>
                  )}

                  {authError && <ErrorBox message={authError} />}

                  <SubmitButton
                    loading={authLoading}
                    label={isDoctor ? 'Accéder au Dashboard' : "S'inscrire"}
                    disabled={!isDoctor && !termsChecked}
                  />
                </form>

                <p className="text-center text-sm text-neutral-500">
                  Déjà un compte ?{' '}
                  <button
                    onClick={() => { setAuthScreen('login'); setAuthError(''); }}
                    className="text-[#0078FF] font-bold hover:underline"
                  >
                    Se connecter
                  </button>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ── Sous-composants internes ─────────────────────────────────

/** Toggle "Patient / Médecin" */
function RoleToggle({ isDoctor, onToggle, registerMode = false }) {
  return (
    <div className="flex bg-neutral-100 rounded-2xl p-1">
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isDoctor ? 'bg-white text-[#0078FF] shadow-sm' : 'text-neutral-500'}`}
      >
        👤 {registerMode ? 'Je suis Patient' : 'Patient'}
      </button>
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isDoctor ? 'bg-white text-[#0078FF] shadow-sm' : 'text-neutral-500'}`}
      >
        👨‍⚕️ {registerMode ? 'Je suis Médecin' : 'Médecin'}
      </button>
    </div>
  );
}

/** Champ de saisie générique */
function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-neutral-700">{label}</label>
      <input
        type={type} required value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-100 border-2 border-transparent focus:border-[#0078FF] rounded-xl py-3 px-4 text-sm outline-none transition-all"
      />
    </div>
  );
}

/** Champ mot de passe avec bouton afficher/masquer */
function PasswordField({ value, onChange, show, onToggle }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-neutral-700">Mot de passe</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'} required value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-neutral-100 border-2 border-transparent focus:border-[#0078FF] rounded-xl py-3 px-4 pr-12 text-sm outline-none transition-all"
        />
        <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

/** Boîte d'erreur rouge */
function ErrorBox({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start">
      <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
      <p className="text-xs text-red-600 font-medium">{message}</p>
    </div>
  );
}

/** Bouton de soumission avec état de chargement */
function SubmitButton({ loading, label, disabled = false }) {
  const isDisabled = loading || disabled;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`w-full py-3.5 text-white font-semibold rounded-full shadow-md text-sm flex items-center justify-center gap-2 ${isDisabled ? 'bg-neutral-300 cursor-not-allowed' : 'bg-gradient-to-b from-[#0088FF] to-[#007BFF] hover:opacity-95'}`}
    >
      {loading && <RefreshCw size={16} className="animate-spin" />}
      {loading ? 'Vérification...' : label}
      {!loading && <ChevronRight size={16} />}
    </button>
  );
}
