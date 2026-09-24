import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import './App.css';
import ForgotPassword from './features/auth/pages/Forgotpassword';
import ResetPassword from './features/auth/pages/Resetpassword';
import { loadCsrfToken } from './services/api';

const Dashboard = lazy(() => import('./features/dashboard/pages/Dashboard'));
const WaitingLine = lazy(() => import('./features/waiting-line/pages/Waiting-line'));
const ClinicaOnboarding = lazy(() => import('./features/dashboard/pages/ClinicaOnboarding'));
const CardsDashboard = lazy(() =>
  import('./features/dashboard/components/CardsDashboard').then((module) => ({
    default: module.CardsDashboard
  }))
);
const Patients = lazy(() =>
  import('./features/dashboard/pages/Patients').then((module) => ({
    default: module.Patients
  }))
);
const MedicalRecordHistory = lazy(() => import('./features/medical-record/components/MedicalRecordHistory'));
const ClinicSchedule = lazy(() => import('./features/clinic/pages/clinicSchedule'));
const ReportsPage = lazy(() => import('./features/reports/pages/reportPage'));
const TermsOfUsePage = lazy(() => import('./features/legal/pages/TermsOfUsePage'));
const PrivacyPolicyPage = lazy(() => import('./features/legal/pages/PrivacyPolicyPage'));
const Plans = lazy(() => import('./features/billing/Plans'));
const PublicPresentationPage = lazy(() => import('./features/public/pages/PublicPresentationPage'));

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
  const userName = localStorage.getItem('userName');
  if (!userName) return <Navigate to="/login" replace />;
  return children;
};

function SubscriptionRequiredAlert() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const handleSubscriptionRequired = (event) => {
      setMessage(event.detail?.message || 'Assinatura necessária.');
    };

    window.addEventListener('subscription-required', handleSubscriptionRequired);

    return () => {
      window.removeEventListener('subscription-required', handleSubscriptionRequired);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      className="position-fixed top-0 start-50 translate-middle-x mt-3"
      style={{ zIndex: 2000, width: 'min(560px, calc(100vw - 2rem))' }}
    >
      <div className="alert alert-warning border-0 shadow-sm mb-0" role="alert">
        <div className="d-flex align-items-start gap-3">
          <i className="bi bi-exclamation-triangle-fill text-warning fs-4" />

          <div className="flex-grow-1">
            <div className="fw-bold">Assinatura necessária</div>
            <div className="small text-body-secondary mt-1">
              Escolha um plano MED1PE para começar a utilizar este recurso.
            </div>
          </div>

          <button
            className="btn btn-warning btn-sm fw-semibold"
            type="button"
            onClick={() => window.location.assign('/planos')}
          >
            Ver planos
          </button>

          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={() => setMessage(null)}
          />
        </div>
      </div>
    </div>
  );
}

function App() {
  // Carrega CSRF token na inicialização se houver indicação de sessão (heurística existente)
  // Evita armazenar o token em storage; token fica em memória no client
  useEffect(() => {
    const userName = localStorage.getItem('userName');
    if (userName) {
      loadCsrfToken().catch(() => {});
    }
  }, []);
  return (
    <BrowserRouter>
      <SubscriptionRequiredAlert />
      <Suspense
        fallback={(
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="spinner-border text-primary" role="status" aria-label="Carregando" />
          </div>
        )}
      >
        <Routes>
          <Route path="/" element={<PublicPresentationPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />

          {/* Dashboard geral */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
              <Route index element={<CardsDashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:patientId/history" element={<MedicalRecordHistory />} />
              <Route path="clinica" element={<ClinicaOnboarding />} />
              <Route path="waiting-line" element={<WaitingLine />} />
              <Route path="clinic-schedule" element={<ClinicSchedule />} />
              <Route path="reports" element={<ReportsPage />} />
          </Route>

          <Route path="/planos" element={<PrivateRoute><Plans /></PrivateRoute>} />


          {/* Rota padrão */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );    
}

export default App;
