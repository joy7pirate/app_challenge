// ============================================================
// App.jsx
// ------------------------------------------------------------
// Composant racine de l'application MedaClick.
// Rôle unique : décider QUOI afficher selon l'état d'auth.
//
// Toute la logique est dans le hook useAppData.
// Toute l'interface est dans les composants enfants.
//
// Arbre de décision :
//   isLoggedIn = false  → AuthScreen
//   isLoggedIn = true
//     userRole = 'doctor'  → DoctorDashboard
//     userRole = 'patient' → PatientApp
// ============================================================

import { useAppData } from './hooks/useAppData.js';
import AuthScreen      from './components/auth/AuthScreen.jsx';
import DoctorDashboard from './components/doctor/DoctorDashboard.jsx';
import PatientApp      from './components/patient/PatientApp.jsx';

/**
 * Point d'entrée de l'application.
 * Ne contient aucun JSX direct — délègue tout aux composants.
 */
export default function App() {
  // Récupère tout le state et les handlers depuis le hook
  const data = useAppData();

  // ── Écran d'authentification ──────────────────────────────
  if (!data.isLoggedIn) {
    return (
      <AuthScreen
        authScreen={data.authScreen}     setAuthScreen={data.setAuthScreen}
        isDoctor={data.isDoctor}         setIsDoctor={data.setIsDoctor}
        authEmail={data.authEmail}       setAuthEmail={data.setAuthEmail}
        authPassword={data.authPassword} setAuthPassword={data.setAuthPassword}
        authName={data.authName}         setAuthName={data.setAuthName}
        authPhone={data.authPhone}       setAuthPhone={data.setAuthPhone}
        showPassword={data.showPassword} setShowPassword={data.setShowPassword}
        termsChecked={data.termsChecked} setTermsChecked={data.setTermsChecked}
        doctorEmail={data.doctorEmail}   setDoctorEmail={data.setDoctorEmail}
        doctorNom={data.doctorNom}       setDoctorNom={data.setDoctorNom}
        authError={data.authError}       setAuthError={data.setAuthError}
        authLoading={data.authLoading}
        handleLogin={data.handleLogin}
        handleRegister={data.handleRegister}
        // Accès démo patient sans saisie
        onDemoLogin={() => {
          data.setIsDoctor(false);
          data.handleLogin({ preventDefault: () => {} });
        }}
      />
    );
  }

  // ── Dashboard médecin ─────────────────────────────────────
  if (data.userRole === 'doctor' && data.doctorProfile) {
    return (
      <DoctorDashboard
        doctorProfile={data.doctorProfile}
        appointments={data.appointments}
        doctorDispos={data.doctorDispos}
        doctorTab={data.doctorTab}           setDoctorTab={data.setDoctorTab}
        showAddDispo={data.showAddDispo}     setShowAddDispo={data.setShowAddDispo}
        newDispoJour={data.newDispoJour}     setNewDispoJour={data.setNewDispoJour}
        newDispoDebut={data.newDispoDebut}   setNewDispoDebut={data.setNewDispoDebut}
        newDispoFin={data.newDispoFin}       setNewDispoFin={data.setNewDispoFin}
        handleRdvStatus={data.handleRdvStatus}
        handleAddDispo={data.handleAddDispo}
        handleDeleteDispo={data.handleDeleteDispo}
        handleLogout={data.handleLogout}
      />
    );
  }

  // ── Application patient ───────────────────────────────────
  return (
    <PatientApp
      patient={data.patient}
      appointments={data.appointments}
      activeTab={data.activeTab}           setActiveTab={data.setActiveTab}
      currentView={data.currentView}       setCurrentView={data.setCurrentView}
      selectedDoctor={data.selectedDoctor}
      selectedDispo={data.selectedDispo}
      bookingConfirmed={data.bookingConfirmed}
      goToDoctorDetail={data.goToDoctorDetail}
      goToBooking={data.goToBooking}
      handleConfirmBooking={data.handleConfirmBooking}
      patientNom={data.patientNom}         setPatientNom={data.setPatientNom}
      patientTel={data.patientTel}         setPatientTel={data.setPatientTel}
      motif={data.motif}                   setMotif={data.setMotif}
      useAmo={data.useAmo}                 setUseAmo={data.setUseAmo}
      amoNum={data.amoNum}                 setAmoNum={data.setAmoNum}
      medecins={data.medecins}
      centres={data.centres}
      loadingMedecins={data.loadingMedecins}
      filteredDoctors={data.filteredDoctors}
      searchQuery={data.searchQuery}       setSearchQuery={data.setSearchQuery}
      specialtyFilter={data.specialtyFilter} setSpecialtyFilter={data.setSpecialtyFilter}
      activeCentreId={data.activeCentreId} setActiveCentreId={data.setActiveCentreId}
      activeProfileSubmenu={data.activeProfileSubmenu}
      setActiveProfileSubmenu={data.setActiveProfileSubmenu}
      chatMessages={data.chatMessages}
      newMessage={data.newMessage}         setNewMessage={data.setNewMessage}
      isAiTyping={data.isAiTyping}
      chatEndRef={data.chatEndRef}
      handleSendChat={data.handleSendChat}
      handleLogout={data.handleLogout}
    />
  );
}
