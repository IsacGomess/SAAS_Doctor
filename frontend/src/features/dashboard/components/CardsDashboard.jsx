
import { Fragment, useCallback, useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/dashboardService';
import { getPlansWeekly } from '../services/planService';
import { updateAppointmentStatus } from '../../clinic/services/appointmentService';
import { createWaitingLineEntry, getWaitingLine } from '../../waiting-line/services/waitingLineService';
import { useAuth } from '../../../hooks/useAuth';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import './CardsDashboard.css';

const DEFAULT_CLINIC_AREA = 'Geral';

const dashboardGridVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: 'easeOut',
            staggerChildren: 0.06
        }
    }
};

const dashboardCardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

export function CardsDashboard() {
    const [summary, setSummary] = useState({
        dashboardPlan: null,
        consultasHoje: 0,
        novosPacientesSemana: 0,
        atendidosSemana: 0,
        cancelamentosSemana: 0,
        occupancyNext7Days: 0,
        occupancyLast7Days: 0,
        weeklyAppointmentsByDay: [],
        weeklyStatusByDay: [],
        professionalDefaultPrice: null,
        professionalHasPrice: false,
        professionalTopPatientsMonth: [],
        professionalReturnsByMonth: [],
        professionalFinancialDisclaimer: '',
        agendaHoje: []
    });
    const [plans, setPlans] = useState([]);
    const [weeklyCapacity, setWeeklyCapacity] = useState(80);
    const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
    const [addingPatientId, setAddingPatientId] = useState(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const { clinicArea, clinicaId, userId } = useAuth();
    const prefersReducedMotion = useReducedMotion();
    const isProfessionalPlan = summary.dashboardPlan === 'professional';

    const loadSummary = useCallback(async () => {
        try {
            const data = await getDashboardSummary();
            setSummary({
                dashboardPlan: data?.dashboardPlan ?? null,
                consultasHoje: data?.consultasHoje ?? 0,
                novosPacientesSemana: data?.novosPacientesSemana ?? 0,
                atendidosSemana: data?.atendidosSemana ?? 0,
                cancelamentosSemana: data?.cancelamentosSemana ?? 0,
                occupancyNext7Days: data?.occupancyNext7Days ?? 0,
                occupancyLast7Days: data?.occupancyLast7Days ?? 0,
                weeklyAppointmentsByDay: data?.weeklyAppointmentsByDay ?? [],
                weeklyStatusByDay: data?.weeklyStatusByDay ?? [],
                professionalDefaultPrice: data?.professionalDefaultPrice ?? null,
                professionalHasPrice: data?.professionalHasPrice ?? false,
                professionalTopPatientsMonth: data?.professionalTopPatientsMonth ?? [],
                professionalReturnsByMonth: data?.professionalReturnsByMonth ?? [],
                professionalFinancialDisclaimer: data?.professionalFinancialDisclaimer ?? '',
                agendaHoje: data?.agendaHoje ?? []
            });

            if (data?.dashboardPlan !== 'professional') {
                try {
                    const plansData = await getPlansWeekly(5);
                    setPlans(plansData || []);
                } catch (err) {
                    console.warn('Erro ao carregar planos semanais:', err);
                }
            } else {
                setPlans([]);
            }
        } catch (error) {
            console.error('Erro ao carregar resumo do dashboard:', error);
        }
    }, []);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

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

    const agendaAtendidosHoje = summary.agendaHoje.filter((item) => item.status === 'atendido').length;
    const agendaCanceladosHoje = summary.agendaHoje.filter((item) => item.status === 'cancelado').length;

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

    const formatCurrencyBRL = (value) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return 'Estimativa indisponível';
        }

        return Number(value).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const toggleDetails = (appointmentId) => {
        setExpandedAppointmentId((current) => (current === appointmentId ? null : appointmentId));
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            setStatusUpdatingId(appointmentId);
            await updateAppointmentStatus(appointmentId, newStatus);
            await loadSummary();
        } catch {
            alert('Erro ao atualizar status');
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleAddToWaitingLine = async (appointment) => {
        try {
            setAddingPatientId(appointment._id);

            const patientId = appointment.patientId?._id || appointment.patientId;
            if (!patientId) {
                alert('Paciente não identificado para adicionar à fila.');
                return;
            }

            const selectedClinicArea = clinicArea || localStorage.getItem('clinicArea') || DEFAULT_CLINIC_AREA;
            const selectedClinicaId = clinicaId || localStorage.getItem('clinicaId');

            try {
                const listResp = await getWaitingLine({ clinicArea: selectedClinicArea });
                const list = Array.isArray(listResp) ? listResp : (listResp?.waitingLine || []);
                const todays = list.filter((entry) => {
                    const pid = entry.patientId && (entry.patientId._id || entry.patientId);
                    if (!pid || pid.toString() !== patientId.toString()) return false;
                    const checkIn = entry.checkInAt || entry.calledAt || entry.attendedAt;
                    if (!checkIn) return false;
                    const d = new Date(checkIn);
                    const today = new Date();
                    return d.getFullYear() === today.getFullYear()
                        && d.getMonth() === today.getMonth()
                        && d.getDate() === today.getDate()
                        && entry.status !== 'finalizado'
                        && entry.status !== 'cancelado';
                });

                if (todays.length > 0) {
                    alert('Este paciente já foi inserido na fila hoje.');
                    return;
                }
            } catch (err) {
                console.warn('Falha ao verificar duplicatas na fila:', err);
            }

            const payload = {
                patientId,
                clinicaId: selectedClinicaId,
                clinicArea: selectedClinicArea,
                assignedTo: userId || undefined,
                source: 'consulta_agendada'
            };

            const createdEntry = await createWaitingLineEntry(payload);
            if (!createdEntry?.success && !createdEntry?.entry) {
                throw new Error('A API não confirmou a inclusão do paciente na fila.');
            }

            alert(`Paciente ${appointment.patientName || 'Paciente'} adicionado à fila de espera.`);
        } catch (error) {
            console.error('Erro ao adicionar paciente à fila de espera:', error);
            alert('Não foi possível adicionar o paciente à fila. Tente novamente.');
        } finally {
            setAddingPatientId(null);
        }
    };

    return (
        <>
        <motion.div
            className="dashboard-cards-wrapper"
            variants={prefersReducedMotion ? undefined : dashboardGridVariants}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
        >
            <div className="row g-4">
                
                {/* ------------------------------------------------------------- */}
                {/* COLUNA DA ESQUERDA: Ocupa 8 partes da tela (Cerca de 66%)       */}
                {/* ------------------------------------------------------------- */}
                <div className="col-12 col-xl-8 d-flex flex-column gap-3">
                    
                    {/* CARD 1: Visão Geral do Dia */}
                    <motion.div className="card border-0 rounded-4 overflow-hidden dashboard-card dashboard-overview-card" variants={prefersReducedMotion ? undefined : dashboardCardVariants}>
                        <div className="card-body dashboard-overview-body">
                            <div className="d-flex justify-content-between align-items-start mb-4 gap-2">
                                <h5 className="card-title fs-5 fw-bold text-uppercase m-0">Visão Geral da Semana</h5>
                                <small className="dashboard-card-hint">ⓘ Dynâmico data</small>
                            </div>
                            
                            {/* Os 4 mini-quadrados internos */}
                            <div className="row g-3">
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3 dashboard-stat-card">
                                        <small className="d-block text-truncate opacity-75 mb-1">Consultas <br /> Agendadas hoje </small>
                                        <span className="fs-2 fw-bold">{summary.consultasHoje}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3 dashboard-stat-card">
                                        <small className="d-block text-truncate opacity-75 mb-1">Novos <br /> Pacientes</small>
                                        <span className="fs-2 fw-bold">{summary.novosPacientesSemana}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3 dashboard-stat-card">
                                        <small className="d-block text-truncate opacity-75 mb-1">Atendidos <br /> hoje</small>
                                        <span className="fs-2 fw-bold">{agendaAtendidosHoje}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3 dashboard-stat-card dashboard-stat-card-alert">
                                        <small className="d-block text-truncate mb-1">Cancelados <br /> hoje</small>
                                        <span className="fs-2 fw-bold">{agendaCanceladosHoje}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* CARD 3: Agenda de Hoje (Mais alto e logo abaixo do card verde) */}
                    <motion.div className="card border-0 rounded-4 dashboard-card dashboard-surface-card" variants={prefersReducedMotion ? undefined : dashboardCardVariants}>
                        <div className="card-body dashboard-surface-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="card-title fs-5 fw-bold text-uppercase m-0 dashboard-section-title">Agenda de Hoje</h5>
                                <select className="form-select form-select-sm w-auto dashboard-select">
                                    <option>Geral</option>
                                </select> 
                            </div>

                            <div className="table-responsive dashboard-table-wrap">
                                <table className="table table-hover align-middle m-0 dashboard-table">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Hora</th>
                                            <th>Paciente</th>
                                            <th>Tipo</th>
                                            <th>Status</th>
                                            <th className="text-end">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.agendaHoje.length > 0 ? (
                                            summary.agendaHoje.map((appointment, index) => {
                                                const isExpanded = expandedAppointmentId === appointment._id;

                                                return (
                                                    <Fragment key={`dashboard-${appointment._id}`}>
                                                        <motion.tr
                                                            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.24, ease: 'easeOut', delay: index * 0.03 }}
                                                        >
                                                            <td>{formatHour(appointment.appointmentDate)}</td>
                                                            <td><strong>{appointment.patientName}</strong></td>
                                                            <td>{appointment.notes || 'Consulta'}</td>
                                                            <td>
                                                                <AnimatePresence mode="wait" initial={false}>
                                                                    <motion.span
                                                                        key={`${appointment._id}-${appointment.status}`}
                                                                        className={`badge rounded-pill px-3 py-2 ${getBadgeClass(appointment.status)}`}
                                                                        initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                                                                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                                                                    >
                                                                        {getBadgeLabel(appointment.status)}
                                                                    </motion.span>
                                                                </AnimatePresence>
                                                            </td>
                                                            <td className="text-end">
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary"
                                                                    onClick={() => toggleDetails(appointment._id)}
                                                                    aria-expanded={isExpanded}
                                                                    aria-controls={`dashboard-appointment-details-${appointment._id}`}
                                                                >
                                                                    {isExpanded ? 'Fechar detalhes' : 'Ver detalhes'}
                                                                </button>
                                                            </td>
                                                        </motion.tr>

                                                        <tr>
                                                            <td colSpan="5" className="p-0 border-0">
                                                                <AnimatePresence initial={false}>
                                                                    {isExpanded && (
                                                                        <motion.div
                                                                            id={`dashboard-appointment-details-${appointment._id}`}
                                                                            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                                                                            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                                                                            className="d-flex flex-wrap gap-2 align-items-center justify-content-between dashboard-expanded-row"
                                                                        >
                                                                            <small className="text-muted">{appointment.notes || 'Sem observações'}</small>

                                                                            <div className="d-flex flex-wrap gap-2">
                                                                                {['agendado', 'confirmado'].includes(appointment.status) && (
                                                                                    <button
                                                                                        className="btn btn-sm btn-outline-success"
                                                                                        onClick={() => handleAddToWaitingLine(appointment)}
                                                                                        disabled={addingPatientId === appointment._id}
                                                                                    >
                                                                                        {addingPatientId === appointment._id ? 'Adicionando...' : 'Add à Fila de espera'}
                                                                                    </button>
                                                                                )}

                                                                                <button
                                                                                    className="btn btn-sm btn-outline-success"
                                                                                    onClick={() => handleStatusChange(appointment._id, 'confirmado')}
                                                                                    disabled={statusUpdatingId === appointment._id}
                                                                                >
                                                                                    Confirmar
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-secondary"
                                                                                    onClick={() => handleStatusChange(appointment._id, 'atendido')}
                                                                                    disabled={statusUpdatingId === appointment._id}
                                                                                >
                                                                                    Marcar como Atendido
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-danger"
                                                                                    onClick={() => handleStatusChange(appointment._id, 'cancelado')}
                                                                                    disabled={statusUpdatingId === appointment._id}
                                                                                >
                                                                                    Cancelar Agendamento
                                                                                </button>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </td>
                                                        </tr>
                                                    </Fragment>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted py-3">Nenhum agendamento para hoje.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* ------------------------------------------------------------- */}
                {/* COLUNA DA DIREITA: Ocupa 4 partes da tela (Cerca de 33%)        */}
                {/* ------------------------------------------------------------- */}
                <div className="col-12 col-xl-4 d-flex flex-column gap-4">
                    
                    {/* CARD 4: Conteúdo superior direito */}
                    <motion.div className="card border-0 rounded-4 dashboard-card dashboard-surface-card dashboard-plan-card" variants={prefersReducedMotion ? undefined : dashboardCardVariants}>
                        <div className="card-body dashboard-surface-body">
                            <h5 className="card-title fs-6 fw-bold text-uppercase mb-4 dashboard-section-title">
                                {isProfessionalPlan ? 'Ranking de pacientes mais atendidos no mês' : 'Planos mais Ultilizados na Semana'}
                            </h5>

                            <div className="dashboard-chart-list">
                                {isProfessionalPlan ? (
                                    summary.professionalTopPatientsMonth.length === 0 ? (
                                        <div className="text-muted">Nenhum atendimento com status Atendido no mês vigente.</div>
                                    ) : (
                                        (() => {
                                            const max = Math.max(...summary.professionalTopPatientsMonth.map((p) => p.atendimentos), 1);
                                            return summary.professionalTopPatientsMonth.map((patient) => (
                                                <div key={patient.patientId || patient.patientName} className="mb-3 pb-2 border-bottom dashboard-list-item">
                                                    <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                                                        <div className="dashboard-list-title text-truncate" title={patient.patientName}>
                                                            {patient.patientName}
                                                        </div>
                                                        <div className="dashboard-list-value">
                                                            {patient.atendimentos}
                                                        </div>
                                                    </div>
                                                    <div className="dashboard-bar-wrap">
                                                        <div className="dashboard-bar-track">
                                                            <div className="dashboard-bar-fill" style={{ width: `${Math.round((patient.atendimentos / max) * 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-end mt-1">
                                                        <div className="dashboard-estimated-value">
                                                        {formatCurrencyBRL(patient.estimativa)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        })()
                                    )
                                ) : (
                                    plans.length === 0 ? (
                                        <div className="text-muted">Nenhum uso de plano registrado nesta semana.</div>
                                    ) : (
                                        (() => {
                                            const max = Math.max(...plans.map(p => p.total), 1);
                                            return plans.map((p) => (
                                                <div key={p.nome} className="d-flex align-items-center gap-3 mb-2 dashboard-list-item">
                                                    <div className="dashboard-list-title text-truncate">{p.nome}</div>
                                                    <div className="dashboard-bar-wrap">
                                                        <div className="dashboard-bar-track">
                                                            <div className="dashboard-bar-fill" style={{ width: `${Math.round((p.total / max) * 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="dashboard-list-value">{p.total}</div>
                                                </div>
                                            ));
                                        })()
                                    )
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* CARD 5: Conteúdo inferior direito */}
                    <motion.div className="card border-0 rounded-4 dashboard-card dashboard-surface-card" variants={prefersReducedMotion ? undefined : dashboardCardVariants}>
                        <div className="card-body dashboard-surface-body">
                            <div className="mb-4">
                                <h5 className="card-title fs-6 fw-bold text-uppercase m-0 dashboard-section-title">
                                    {isProfessionalPlan ? 'Retornos Financeiros' : 'Status da Clínica'}
                                </h5>
                                <small className="text-muted">
                                    {isProfessionalPlan ? '(Estimativa)' : '( Taxa de Ocupação )'}
                                </small>
                            </div>
                            {isProfessionalPlan ? (
                                summary.professionalHasPrice ? (
                                    <>
                                        <small className="text-muted d-block mb-3">
                                            {summary.professionalFinancialDisclaimer || 'Estimativa baseada no valor particular padrão.'}
                                        </small>
                                        <div className="d-flex flex-column gap-2">
                                            {summary.professionalReturnsByMonth.map((month) => {
                                                const max = Math.max(...summary.professionalReturnsByMonth.map((m) => m.estimativa || 0), 1);
                                                const percentage = month.estimativa ? Math.round((month.estimativa / max) * 100) : 0;

                                                return (
                                                    <div key={month.mes}>
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <small className="text-muted text-uppercase">{month.label}</small>
                                                            <strong className="dashboard-accent-text">{formatCurrencyBRL(month.estimativa)}</strong>
                                                        </div>
                                                        <small className="text-muted d-block mb-1">Atendidos: {month.atendimentos}</small>
                                                        <div className="progress" style={{ height: '8px' }}>
                                                            <div
                                                                className="progress-bar dashboard-progress-fill"
                                                                role="progressbar"
                                                                aria-label={`Retorno estimado de ${month.label}`}
                                                                aria-valuenow={percentage}
                                                                aria-valuemin="0"
                                                                aria-valuemax="100"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="alert alert-warning mb-0" role="alert">
                                        Configure o valor particular padrão em Meus dados profissionais para visualizar as estimativas financeiras.
                                    </div>
                                )
                            ) : (
                                <>
                                    <small className="text-muted"> </small>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control form-control-sm mb-3 dashboard-capacity-input"
                                        aria-label="Número máximo de atendimentos semanais"
                                        value={weeklyCapacity}
                                        onChange={(event) => setWeeklyCapacity(Number(event.target.value))}
                                    />

                                    <div className="d-flex flex-column gap-2">
                                        {weeklyOccupancy.map((weekday) => (
                                            <div key={weekday.dayOfWeek}>
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small className="text-muted">{weekday.label}</small>
                                                    <strong className="dashboard-accent-text">
                                                        {weekday.percentage}% ({weekday.total})
                                                    </strong>
                                                </div>
                                                <div className="progress" style={{ height: '8px' }}>
                                                    <div
                                                        className="progress-bar dashboard-progress-fill"
                                                        role="progressbar"
                                                        aria-label={`Ocupação de ${weekday.label}`}
                                                        aria-valuenow={weekday.percentage}
                                                        aria-valuemin="0"
                                                        aria-valuemax="100"
                                                        style={{ width: `${weekday.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>

                </div>

            </div>
        </motion.div>
        </>
    )
}