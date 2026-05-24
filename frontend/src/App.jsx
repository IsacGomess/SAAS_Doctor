import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ClinicaOnboarding from './pages/ClinicaOnboarding';
import './App.css';
import { CardsDashboard } from './pages-components/cards-dashboard';
import { Patients } from './patient-routes/register';

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
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
            <Route path="clinica" element={<ClinicaOnboarding />} />
        </Route>

        <Route 
          path="/doctor/waiting-line" 
          element={<PrivateRoute><DoctorDashboard /></PrivateRoute>} 
        />

        {/* Rota padrão */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );    
}

export default App;
