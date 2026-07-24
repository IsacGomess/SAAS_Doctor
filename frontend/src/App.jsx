import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import Dashboard from './features/dashboard/pages/Dashboard';
import WaitingLine from './features/waiting-line/pages/Waiting-line';
import ClinicaOnboarding from './features/dashboard/pages/ClinicaOnboarding';
import './App.css';
import { CardsDashboard } from './features/dashboard/components/CardsDashboard';
import { Patients } from './features/dashboard/pages/Patients';
import MedicalRecordHistory from './features/medical-record/components/MedicalRecordHistory';
import ClinicSchedule from './features/clinic/pages/clinicSchedule';
import ReportsPage  from './features/reports/pages/reportPage';

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
  const userName = localStorage.getItem('userName');
  if (!userName) return <Navigate to="/login" replace />;
  return children;
} 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
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


        {/* Rota padrão */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );    
}

export default App;
