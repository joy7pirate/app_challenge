// ============================================================
// components/patient/PatientApp.jsx
// ------------------------------------------------------------
// Shell de l'application patient.
// Orchestre les 5 onglets, la navigation vers les vues
// détaillées (profil médecin, réservation) et la bottom nav.
//
// Hiérarchie des vues contrôlée par currentView :
//   'main'           → les 5 onglets + bottom nav
//   'doctorDetail'   → profil complet d'un médecin
//   'confirmBooking' → formulaire de réservation
// ============================================================

import { Bell } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import BottomNav from './BottomNav.jsx';
import HomeTab      from './tabs/HomeTab.jsx';
import DoctorsTab   from './tabs/DoctorsTab.jsx';
import HospitalsTab from './tabs/HospitalsTab.jsx';
import AiChatTab    from './tabs/AiChatTab.jsx';
import ProfileTab   from './tabs/ProfileTab.jsx';
import DoctorDetailView from '../shared/DoctorDetailView.jsx';
import BookingView      from '../shared/BookingView.jsx';

/**
 * Application patient complète.
 * Reçoit toutes les données et handlers depuis App.jsx.
 */
export default function PatientApp({
  // Données patient
  patient,
  appointments,

  // Navigation
  activeTab, setActiveTab,
  currentView, setCurrentView,

  // Médecin + réservation
  selectedDoctor, selectedDispo,
  bookingConfirmed,
  goToDoctorDetail, goToBooking, handleConfirmBooking,

  // Formulaire réservation
  patientNom, setPatientNom,
  patientTel, setPatientTel,
  motif, setMotif,
  useAmo, setUseAmo,
  amoNum, setAmoNum,

  // Données API
  medecins, centres, loadingMedecins,
  filteredDoctors,
  searchQuery, setSearchQuery,
  specialtyFilter, setSpecialtyFilter,

  // Centres
  activeCentreId, setActiveCentreId,
  activeProfileSubmenu, setActiveProfileSubmenu,

  // Chat IA
  chatMessages, newMessage, setNewMessage,
  isAiTyping, chatEndRef, handleSendChat,

  // Auth
  handleLogout,
}) {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#F8F9FA] flex flex-col relative shadow-2xl border-x border-neutral-200 overflow-hidden">

        {/* ════ EN-TÊTE (visible uniquement sur la vue principale) ════ */}
        {currentView === 'main' && (
          <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-neutral-100 shadow-sm flex items-center justify-between px-5 h-16 shrink-0">
            {/* Logo cliquable → retour accueil */}
            <button
              onClick={() => { setActiveTab('home'); setCurrentView('main'); }}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-full bg-[#0078FF] flex items-center justify-center text-white font-extrabold text-sm">
                {patient?.name?.[0] || 'A'}
              </div>
              <span className="font-extrabold text-xl text-[#0078FF]">MedaClick</span>
            </button>
            {/* Cloche de notification avec pastille rouge */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#0078FF] hover:bg-neutral-100 relative">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </header>
        )}

        {/* ════ VUE : PROFIL MÉDECIN ════ */}
        {currentView === 'doctorDetail' && selectedDoctor && (
          <DoctorDetailView
            doctor={selectedDoctor}
            onBack={() => setCurrentView('main')}
            onBook={goToBooking}
          />
        )}

        {/* ════ VUE : FORMULAIRE DE RÉSERVATION ════ */}
        {currentView === 'confirmBooking' && selectedDoctor && (
          <BookingView
            doctor={selectedDoctor}
            dispo={selectedDispo}
            patient={patient}
            patientNom={patientNom} setPatientNom={setPatientNom}
            patientTel={patientTel} setPatientTel={setPatientTel}
            motif={motif} setMotif={setMotif}
            useAmo={useAmo} setUseAmo={setUseAmo}
            amoNum={amoNum} setAmoNum={setAmoNum}
            confirmed={bookingConfirmed}
            onConfirm={handleConfirmBooking}
            onBack={() => setCurrentView(selectedDispo ? 'doctorDetail' : 'main')}
            onHome={() => { setActiveTab('home'); setCurrentView('main'); }}
          />
        )}

        {/* ════ VUE PRINCIPALE : ONGLETS ════ */}
        {currentView === 'main' && (
          <main className="flex-1 overflow-y-auto pb-24">
            <AnimatePresence mode="wait">

              {activeTab === 'home' && (
                <HomeTab
                  medecins={medecins}
                  centres={centres}
                  loadingMedecins={loadingMedecins}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setSpecialtyFilter={setSpecialtyFilter}
                  setActiveTab={setActiveTab}
                  goToDoctorDetail={goToDoctorDetail}
                />
              )}

              {activeTab === 'doctors' && (
                <DoctorsTab
                  filteredDoctors={filteredDoctors}
                  loadingMedecins={loadingMedecins}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  specialtyFilter={specialtyFilter}
                  setSpecialtyFilter={setSpecialtyFilter}
                  goToDoctorDetail={goToDoctorDetail}
                />
              )}

              {activeTab === 'hospitals' && (
                <HospitalsTab
                  centres={centres}
                  activeCentreId={activeCentreId}
                  setActiveCentreId={setActiveCentreId}
                />
              )}

              {activeTab === 'aihealth' && (
                <AiChatTab
                  chatMessages={chatMessages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  isAiTyping={isAiTyping}
                  chatEndRef={chatEndRef}
                  handleSendChat={handleSendChat}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileTab
                  patient={patient}
                  appointments={appointments}
                  activeProfileSubmenu={activeProfileSubmenu}
                  setActiveProfileSubmenu={setActiveProfileSubmenu}
                  handleLogout={handleLogout}
                />
              )}

            </AnimatePresence>
          </main>
        )}

        {/* ════ BARRE DE NAVIGATION BAS ════ */}
        {/* Cachée quand on est sur une vue détaillée */}
        {currentView === 'main' && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

      </div>
    </div>
  );
}
