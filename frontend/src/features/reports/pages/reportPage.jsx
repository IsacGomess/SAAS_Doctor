import React, { useEffect, useState } from 'react';
import { getAppointmentsMonthly, getPatientsGrowth, getWaitTimeMonthly, getPlansMonthly } from '../services/reportService';
import { ClinicCharts } from '../components/Clinic';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    appointments: [],
    patients: [],
    waitTime: [],
    plansMonthly: []
  });

  useEffect(() => {
    const loadAllReports = async () => {
      setLoading(true);
      setError('');
      try {
        // Os relatórios principais continuam independentes da nova métrica de planos.
        const [appointments, patients, waitTime] = await Promise.all([
          getAppointmentsMonthly(),
          getPatientsGrowth(),
          getWaitTimeMonthly()
        ]);

        let plansMonthly = [];
        try {
          plansMonthly = await getPlansMonthly();
        } catch (plansError) {
          // Permite exibir os relatórios existentes se o backend ainda não foi reiniciado.
          console.warn('Não foi possível carregar atendimentos por plano:', plansError);
        }

        setData({ appointments, patients, waitTime, plansMonthly });
      } catch (err) {
        console.error('Erro ao carregar relatórios:', err);
        setError(err?.response?.data?.message || 'Não foi possível carregar os dados gerenciais.');
      } finally {
        setLoading(false);
      }
    };

    loadAllReports();
  }, []);

  return (
    <div className="container-fluid pt-5 ps-1 pe-4 w-100" style={{ minHeight: '100%' }}>
      {/* Título da Feature */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0" style={{ color: '#2C3E50' }}>Relatórios Gerenciais</h2>
          <p className="text-muted m-0">Acompanhe os indicadores de desempenho, fluxo e crescimento da clínica.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm" role="alert">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white">
          <div className="spinner-border" style={{ color: '#1E6B65' }} role="status"></div>
          <p className="text-muted mt-3 mb-0">Processando métricas e gerando gráficos...</p>
        </div>
      ) : (
        /* Renderiza os gráficos se tudo estiver carregado com sucesso */
        <ClinicCharts 
          appointmentsData={data.appointments} 
          patientsData={data.patients} 
          waitTimeData={data.waitTime} 
          plansMonthlyData={data.plansMonthly}
        />
      )}
    </div>
  );
};

export default ReportsPage;