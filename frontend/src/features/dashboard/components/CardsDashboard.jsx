
import { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/dashboardService';
import { getPlansWeekly } from '../services/planService';

export function CardsDashboard() {
    const [summary, setSummary] = useState({
        consultasHoje: 0,
        novosPacientesSemana: 0,
        atendidosSemana: 0,
        cancelamentosSemana: 0,
        occupancyNext7Days: 0,
        occupancyLast7Days: 0,
        weeklyAppointmentsByDay: [],
        agendaHoje: []
    });
    const [plans, setPlans] = useState([]);
    const [weeklyCapacity, setWeeklyCapacity] = useState(80);

    useEffect(() => {
        const loadSummary = async () => {
            try {
                const data = await getDashboardSummary();
                setSummary({
                    consultasHoje: data?.consultasHoje ?? 0,
                    novosPacientesSemana: data?.novosPacientesSemana ?? 0,
                    atendidosSemana: data?.atendidosSemana ?? 0,
                    cancelamentosSemana: data?.cancelamentosSemana ?? 0,
                    occupancyNext7Days: data?.occupancyNext7Days ?? 0,
                    occupancyLast7Days: data?.occupancyLast7Days ?? 0,
                    weeklyAppointmentsByDay: data?.weeklyAppointmentsByDay ?? [],
                    agendaHoje: data?.agendaHoje ?? []
                });
                try {
                    const plansData = await getPlansWeekly(5);
                    setPlans(plansData || []);
                } catch (err) {
                    console.warn('Erro ao carregar planos semanais:', err);
                }
            } catch (error) {
                console.error('Erro ao carregar resumo do dashboard:', error);
            }
        };

        loadSummary();
    }, []);

    const formatHour = (value) => {
        if (!value) return '--:--';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '--:--';

        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getBadgeClass = (status) => {
        switch (status) {
            case 'cancelado':
                return 'bg-danger-subtle text-danger';
            case 'atendido':
                return 'bg-success-subtle text-success';
            case 'confirmado':
                return 'bg-success-subtle text-success';
            default:
                return 'bg-warning-subtle text-warning';
        }
    };

    const weekdays = [
        { label: 'Segunda-feira', dayOfWeek: 2 },
        { label: 'Terça-feira', dayOfWeek: 3 },
        { label: 'Quarta-feira', dayOfWeek: 4 },
        { label: 'Quinta-feira', dayOfWeek: 5 },
        { label: 'Sexta-feira', dayOfWeek: 6 }
    ];

    const weeklyOccupancy = weekdays.map((weekday) => {
        const dayData = summary.weeklyAppointmentsByDay.find(
            (item) => item.dayOfWeek === weekday.dayOfWeek
        );
        const total = dayData?.total ?? 0;
        const percentage = weeklyCapacity > 0
            ? Math.min(Math.round((total / weeklyCapacity) * 100), 100)
            : 0;

        return { ...weekday, total, percentage };
    });

    const getBadgeLabel = (status) => {
        switch (status) {
            case 'cancelado':
                return 'Cancelado';
            case 'atendido':
                return 'Atendido';
            case 'confirmado':
                return 'Confirmado';
            default:
                return 'Pendente';
        }
    };

    return (
        <>
         {/* Container principal ajustado para a sua estrutura de tela */}
        <div className="p-3" style={{  minHeight: '100%' }}>
            
            {/* ROW PRINCIPAL (Divide o espaço total em 12 partes) */}
            <div className="row g-4">
                
                {/* ------------------------------------------------------------- */}
                {/* COLUNA DA ESQUERDA: Ocupa 8 partes da tela (Cerca de 66%)       */}
                {/* ------------------------------------------------------------- */}
                <div className="col-12 col-lg-8 d-flex flex-column gap-3">
                    
                    {/* CARD 1: Visão Geral do Dia */}
                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden" >
                        <div className="card-body" style={{ backgroundColor: '#1E6B65', color: 'white', padding: '24px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="card-title fs-5 fw-bold text-uppercase m-0">Visão Geral da Semana</h5>
                                <small className="opacity-75">ⓘ Dynâmico data</small>
                            </div>
                            
                            {/* Os 4 mini-quadrados internos */}
                            <div className="row g-3">
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                                        <small className="d-block text-truncate opacity-75 mb-1">Consultas <br /> Agendadas hoje </small>
                                        <span className="fs-2 fw-bold">{summary.consultasHoje}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                                        <small className="d-block text-truncate opacity-75 mb-1">Novos <br /> Pacientes</small>
                                        <span className="fs-2 fw-bold">{summary.novosPacientesSemana}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                                        <small className="d-block text-truncate opacity-75 mb-1">Atendidos</small>
                                        <span className="fs-2 fw-bold">{summary.atendidosSemana}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: '#FADBD8', color: '#78281F' }}>
                                        <small className="d-block text-truncate mb-1">Cancelamentos</small>
                                        <span className="fs-2 fw-bold">{summary.cancelamentosSemana}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: Agenda de Hoje (Mais alto e logo abaixo do card verde) */}
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-body" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="card-title fs-5 fw-bold text-uppercase m-0" style={{ color: '#2C3E50' }}>Agenda de Hoje</h5>
                                <select className="form-select form-select-sm w-auto">
                                    <option>Geral</option>
                                </select> 
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle m-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Hora</th>
                                            <th>Paciente</th>
                                            <th>Tipo</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.agendaHoje.length > 0 ? (
                                            summary.agendaHoje.map((appointment) => (
                                                <tr key={appointment._id}>
                                                    <td>{formatHour(appointment.appointmentDate)}</td>
                                                    <td><strong>{appointment.patientName}</strong></td>
                                                    <td>{appointment.notes || 'Consulta'}</td>
                                                    <td><span className={`badge rounded-pill px-3 py-2 ${getBadgeClass(appointment.status)}`}>{getBadgeLabel(appointment.status)}</span></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center text-muted py-3">Nenhum agendamento para hoje.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ------------------------------------------------------------- */}
                {/* COLUNA DA DIREITA: Ocupa 4 partes da tela (Cerca de 33%)        */}
                {/* ------------------------------------------------------------- */}
                <div className="col-12 col-lg-4 d-flex flex-column gap-4">
                    
                    {/* CARD 4: Planos mais Utilizados na Semana */}
                    <div className="card border-0 shadow-sm rounded-3" style={{minHeight:'290px'}}>
                        <div className="card-body" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <h5 className="card-title fs-6 fw-bold text-uppercase mb-4" style={{ color: '#2C3E50' }}>Planos mais Ultilizados na Semana</h5>
                            
                            <div style={{ fontSize: '14px' }}>
                                {plans.length === 0 ? (
                                    <div className="text-muted">Nenhum uso de plano registrado nesta semana.</div>
                                ) : (
                                    (() => {
                                        const max = Math.max(...plans.map(p => p.total), 1);
                                        return plans.map((p) => (
                                            <div key={p.nome} className="d-flex align-items-center gap-3 mb-2">
                                                <div style={{ minWidth: '120px', fontSize: '14px' }} className="text-truncate">{p.nome}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ background: '#F1F3F5', height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.round((p.total / max) * 100)}%`, height: '10px', background: '#1E6B65' }}></div>
                                                    </div>
                                                </div>
                                                <div style={{ minWidth: '36px', textAlign: 'right', fontWeight: 600 }}>{p.total}</div>
                                            </div>
                                        ));
                                    })()
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CARD 5: Status da Clínica  */}
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-body" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <div className="mb-4">
                                <h5 className="card-title fs-6 fw-bold text-uppercase m-0" style={{ color: '#2C3E50' }}>Status da Clínica</h5>
                                <small className="text-muted">( Taxa de Ocupação )</small>
                            </div>
                            <small className="text-muted"> </small>
                            <input
                                type="number"
                                min="1"
                                className="form-control form-control-sm mb-3"
                                style={{ width: '165px' }}
                                aria-label="Número máximo de atendimentos semanais"
                                value={weeklyCapacity}
                                onChange={(event) => setWeeklyCapacity(Number(event.target.value))}
                            />

                            <div className="d-flex flex-column gap-2">
                                {weeklyOccupancy.map((weekday) => (
                                    <div key={weekday.dayOfWeek}>
                                        <div className="d-flex justify-content-between mb-1">
                                            <small className="text-muted">{weekday.label}</small>
                                            <strong style={{ color: '#1E6B65' }}>
                                                {weekday.percentage}% ({weekday.total})
                                            </strong>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div
                                                className="progress-bar"
                                                role="progressbar"
                                                aria-label={`Ocupação de ${weekday.label}`}
                                                aria-valuenow={weekday.percentage}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                                style={{ width: `${weekday.percentage}%`, backgroundColor: '#1E6B65' }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
        </>
    )
}