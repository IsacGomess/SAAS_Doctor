import { motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import './PublicPresentationPage.css';

const scheduleData = [
  { hour: '08:00', patient: 'Ana Souza', procedure: 'Retorno ortopedia', status: 'Confirmado' },
  { hour: '09:30', patient: 'Carlos Nunes', procedure: 'Avaliação inicial', status: 'Aguardando' },
  { hour: '11:00', patient: 'Mariana Lima', procedure: 'Revisão de exames', status: 'Em atendimento' },
  { hour: '14:00', patient: 'Joao Victor', procedure: 'Consulta particular', status: 'Confirmado' }
];

const recordData = [
  { label: 'Alergias', value: 'Dipirona' },
  { label: 'Conduta', value: 'Ajuste de analgesia por 7 dias' },
  { label: 'CID', value: 'M54.5 - Dor lombar baixa' },
  { label: 'Proximo retorno', value: '15/10/2026' }
];

const reportData = [
  { metric: 'Atendimentos no mes', value: '286', change: '+12%' },
  { metric: 'Taxa de retorno', value: '78%', change: '+5%' },
  { metric: 'Tempo medio de espera', value: '14 min', change: '-3 min' }
];

const containerAnimation = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      staggerChildren: 0.08
    }
  }
};

const itemAnimation = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
});

export default function PublicPresentationPage() {
  const reduceMotion = useReducedMotion();
  const [simulation, setSimulation] = useState({ completedVisits: 72, averageFee: 220 });

  const grossRevenue = useMemo(() => {
    return Math.max(0, simulation.completedVisits * simulation.averageFee);
  }, [simulation.completedVisits, simulation.averageFee]);

  const rankingData = useMemo(() => {
    const patients = [
      { patient: 'Beatriz L.', baseLift: 1.3 },
      { patient: 'Rafael P.', baseLift: 1.15 },
      { patient: 'Marina C.', baseLift: 1.0 },
      { patient: 'Lucas T.', baseLift: 0.82 },
      { patient: 'Patricia S.', baseLift: 0.7 }
    ];

    return patients
      .map((entry, index) => ({
        ...entry,
        revenue: Math.round((grossRevenue / 3.8) * entry.baseLift * (1 + index * 0.08))
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [grossRevenue]);

  const maxRevenue = Math.max(...rankingData.map((item) => item.revenue), 1);

  const handleSimulationChange = (field) => (event) => {
    const sanitizedValue = Number(event.target.value || 0);
    setSimulation((current) => ({
      ...current,
      [field]: Math.max(field === 'completedVisits' ? 0 : 50, sanitizedValue)
    }));
  };

  return (
    <div className="med1pe-landing">
      <div className="med1pe-bg-glow med1pe-bg-glow-left" />
      <div className="med1pe-bg-glow med1pe-bg-glow-right" />

      <header className="med1pe-nav">
        <div className="med1pe-brand">MED1PE</div>

        <div className="med1pe-nav-actions">
          <a href="/login" className="med1pe-link-btn">Entrar</a>
          <a href="/register" className="med1pe-primary-btn">Criar conta</a>
        </div>
      </header>

      <motion.section
        className="med1pe-hero"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <p className="med1pe-kicker">Plataforma para Clinicas ou profissionais que atendem pacientes de forma independente</p>
        <h1>
          Agendamentos, prontuários e relatórios em um único fluxo.
        </h1>
        <p className="med1pe-hero-subtitle">
          O MED1PE organiza o dia da equipe com visão clara da agenda, histórico clínico e indicadores de desempenho em tempo real.
        </p>

        <div className="med1pe-hero-cta">
          <a href="/register" className="med1pe-primary-btn">Comecar gratuitamente</a>
          <a href="/login" className="med1pe-secondary-btn">Ja tenho conta</a>
        </div>
      </motion.section>

      <main className="med1pe-sections">
        <motion.section
          className="med1pe-showcase"
          variants={containerAnimation}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div className="med1pe-showcase-header" variants={itemAnimation}>
            <h2>Agendamento inteligente</h2>
            <p>Visualize a agenda do dia, status de cada paciente e prioridades da recepcao.</p>
          </motion.div>

          <motion.div className="med1pe-card" variants={itemAnimation}>
            <div className="med1pe-card-title">Agenda de hoje</div>
            <div className="med1pe-grid-row med1pe-grid-head">
              <span>Horario</span>
              <span>Paciente</span>
              <span>Procedimento</span>
              <span>Status</span>
            </div>

            {scheduleData.map((row) => (
              <div className="med1pe-grid-row" key={`${row.hour}-${row.patient}`}>
                <span>{row.hour}</span>
                <span>{row.patient}</span>
                <span>{row.procedure}</span>
                <span className="med1pe-status-pill">{row.status}</span>
              </div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          className="med1pe-showcase"
          variants={containerAnimation}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div className="med1pe-showcase-header" variants={itemAnimation}>
            <h2>Prontuario completo</h2>
            <p>Tenha contexto clinico durante o atendimento com historico e condutas anteriores.</p>
          </motion.div>

          <motion.div className="med1pe-card" variants={itemAnimation}>
            <div className="med1pe-card-title">Resumo do paciente (exemplo)</div>
            <div className="med1pe-record-grid">
              {recordData.map((item) => (
                <div className="med1pe-record-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="med1pe-note">
              Observacao: paciente relatou melhora de 40% apos protocolo inicial. Manter fisioterapia 2x por semana.
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          className="med1pe-showcase"
          variants={containerAnimation}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div className="med1pe-showcase-header" variants={itemAnimation}>
            <h2>Relatorios para decisao</h2>
            <p>Acompanhe indicadores essenciais para melhorar operacao e experiencia do paciente.</p>
          </motion.div>

          <motion.div className="med1pe-report-row" variants={itemAnimation}>
            {reportData.map((item) => (
              <article className="med1pe-metric-card" key={item.metric}>
                <span>{item.metric}</span>
                <strong>{item.value}</strong>
                <em>{item.change}</em>
              </article>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          className="med1pe-plan-showcase"
          variants={containerAnimation}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div className="med1pe-showcase-header med1pe-plan-header" variants={itemAnimation}>
            <span className="med1pe-simulation-badge">Simulação • dados de exemplo</span>
            <h2>Plano Profissional</h2>
            <p>Visualize um cenário ilustrativo do faturamento bruto estimado por atendimentos e valor médio. Isso não representa promessa de ganho nem inclui despesas ou convênios.</p>
          </motion.div>

          <div className="med1pe-simulation-grid">
            <motion.div className="med1pe-card med1pe-simulation-card" variants={itemAnimation}>
              <div className="med1pe-card-title">Configure a simulação</div>

              <label className="med1pe-field">
                <span>Atendimentos concluídos no mês</span>
                <input
                  type="number"
                  min="0"
                  value={simulation.completedVisits}
                  onChange={handleSimulationChange('completedVisits')}
                />
              </label>

              <label className="med1pe-field">
                <span>Valor particular médio</span>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={simulation.averageFee}
                  onChange={handleSimulationChange('averageFee')}
                />
              </label>
            </motion.div>

            <motion.div className="med1pe-card med1pe-highlight-card" variants={itemAnimation}>
              <span className="med1pe-small-label">Faturamento bruto estimado</span>
              <motion.strong
                key={grossRevenue}
                initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {currencyFormatter.format(grossRevenue)}
              </motion.strong>

              <div className="med1pe-simulation-metrics">
                <div>
                  <span>Atendimentos</span>
                  <strong>{simulation.completedVisits}</strong>
                </div>
                <div>
                  <span>Valor médio</span>
                  <strong>{currencyFormatter.format(simulation.averageFee)}</strong>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div className="med1pe-ranking-card" variants={itemAnimation}>
            <div className="med1pe-ranking-header">
              <h3>Prévia de ranking de receita</h3>
              <span>Exemplo fictício</span>
            </div>

            <div className="med1pe-ranking-list">
              {rankingData.map((entry, index) => (
                <motion.div
                  className="med1pe-ranking-item"
                  key={entry.patient}
                  initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.25, delay: index * 0.06 }}
                >
                  <div className="med1pe-ranking-meta">
                    <span className="med1pe-rank-number">#{index + 1}</span>
                    <span>{entry.patient}</span>
                  </div>

                  <div className="med1pe-ranking-bar">
                    <span style={{ width: `${(entry.revenue / maxRevenue) * 100}%` }} />
                  </div>

                  <strong>{currencyFormatter.format(entry.revenue)}</strong>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="med1pe-plan-cta">
            <a href="/register" className="med1pe-primary-btn">Conhecer o plano</a>
            <a href="/login" className="med1pe-secondary-btn">Criar conta</a>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
