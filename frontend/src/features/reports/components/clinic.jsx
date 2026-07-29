import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';

// Tradutor de meses para os gráficos ficarem elegantes
const formatMonthLabel = (value) => {
  if (!value) return '';
  const monthRaw = value.includes('-') ? value.split('-')[1] : value;
  const months = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  };
  return months[monthRaw] || value;
};

export const ClinicCharts = ({ appointmentsData, patientsData, waitTimeData, plansMonthlyData = [] }) => {
  
  // 💡 Tratamento para o Gráfico A (Agendamentos por Status)
  // O MongoDB joga os status em linhas separadas. Vamos agrupar por mês para o Recharts ler
  // 💡 Tratamento para o Gráfico A (Produtividade vs Desistências na Fila)
  const processedAppointments = React.useMemo(() => {
    const monthlyMap = {};
    appointmentsData.forEach(item => {
      const mes = item._id.mes;
      const status = item._id.status;
      
      if (!monthlyMap[mes]) {
        monthlyMap[mes] = { mes, atendido: 0, cancelado: 0 };
      }
      
      // Armazena apenas se for um dos dois status que nos interessam
      if (status === 'atendido' || status === 'cancelado') {
        monthlyMap[mes][status] = item.total;
      }
    });
    return Object.values(monthlyMap).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [appointmentsData]);

  // 💡 Tratamento para o Gráfico B (Novos Pacientes)
  const processedPatients = React.useMemo(() => {
    return [...patientsData].map(item => ({
      ...item,
      name: formatMonthLabel(item._id)
    }));
  }, [patientsData]);

  // 💡 Tratamento para o Gráfico C (Tempo de Espera)
  const processedWaitTime = React.useMemo(() => {
    return [...waitTimeData].map(item => ({
      ...item,
      name: formatMonthLabel(item._id),
      // Arredonda os minutos flutuantes retornados pelo AVG do mongo
      minutos: Math.round(item.tempoMedioEspera) 
    }));
  }, [waitTimeData]);

  const processedPlansMonthly = React.useMemo(() => {
    const monthlyMap = {};
    const plans = new Set();

    plansMonthlyData.forEach((item) => {
      const mes = item.mes;
      const plano = item.plano || 'Particular';
      plans.add(plano);

      if (!monthlyMap[mes]) {
        monthlyMap[mes] = { mes };
      }

      monthlyMap[mes][plano] = item.total;
    });

    return {
      data: Object.values(monthlyMap).sort((a, b) => a.mes.localeCompare(b.mes)),
      plans: [...plans]
    };
  }, [plansMonthlyData]);

  const planColors = ['#1E6B65', '#2E86AB', '#E67E22', '#8E44AD', '#27AE60', '#C0392B'];

  return (
    <div className="row g-4">
      {/* Gráfico A: Agendamentos mensais por status */}
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-3 p-4 bg-white h-100">
          <h6 className="fw-bold mb-4 text-secondary">Agendamentos Mensais por Status</h6>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={processedAppointments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tickFormatter={formatMonthLabel} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="atendido" name="Atendidos" fill="#1E6B65" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelado" name="Cancelados" fill="#E74C3C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico B: Crescimento de Pacientes */}
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-3 p-4 bg-white h-100">
          <h6 className="fw-bold mb-4 text-secondary">Novos Pacientes Cadastrados</h6>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={processedPatients}>
                <defs>
                  <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E6B65" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1E6B65" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="novosPacientes" name="Pacientes" stroke="#1E6B65" strokeWidth={2} fillOpacity={1} fill="url(#colorPacientes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico C: Média de Tempo de Espera */}
      <div className="col-12">
        <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
          <h6 className="fw-bold mb-4 text-secondary">Tempo Médio de Espera na Fila (Minutos até Atendimento)</h6>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={processedWaitTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="minutos" name="Média de Espera" stroke="#E67E22" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico D: Atendimentos mensais por plano */}
      <div className="col-12">
        <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
          <h6 className="fw-bold mb-4 text-secondary">Atendimentos Mensais por Plano de Saúde</h6>
          {processedPlansMonthly.data.length === 0 ? (
            <div className="text-center text-muted py-5">
              Nenhum atendimento por plano registrado neste ano.
            </div>
          ) : (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={processedPlansMonthly.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tickFormatter={formatMonthLabel} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {processedPlansMonthly.plans.map((plan, index) => (
                    <Bar
                      key={plan}
                      dataKey={plan}
                      name={plan}
                      fill={planColors[index % planColors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};