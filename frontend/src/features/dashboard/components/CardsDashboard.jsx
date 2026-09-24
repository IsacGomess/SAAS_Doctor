
import { Fragment, useCallback, useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/dashboardService';
import { getPlansWeekly } from '../services/planService';
import { updateAppointmentStatus } from '../../clinic/services/appointmentService';
import { createWaitingLineEntry, getWaitingLine } from '../../waiting-line/services/waitingLineService';
import { useAuth } from '../../../hooks/useAuth';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const DEFAULT_CLINIC_AREA = 'Geral';

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
                                        <small className="d-block text-truncate opacity-75 mb-1">Atendidos <br /> hoje</small>
                                        <span className="fs-2 fw-bold">{agendaAtendidosHoje}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: '#FADBD8', color: '#78281F' }}>
                                        <small className="d-block text-truncate mb-1">Cancelados <br /> hoje</small>
                                        <span className="fs-2 fw-bold">{agendaCanceladosHoje}</span>
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
                                                                            className="d-flex flex-wrap gap-2 align-items-center justify-content-between"
                                                                            style={{
                                                                                margin: '0.25rem 0 0.7rem',
                                                                                padding: '0.8rem',
                                                                                border: '1px solid #e1e9ef',
                                                                                borderRadius: '12px',
                                                                                background: '#fbfdff',
                                                                                overflow: 'hidden'
                                                                            }}
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
                    </div>

                </div>

                {/* ------------------------------------------------------------- */}
                {/* COLUNA DA DIREITA: Ocupa 4 partes da tela (Cerca de 33%)        */}
                {/* ------------------------------------------------------------- */}
                <div className="col-12 col-lg-4 d-flex flex-column gap-4">
                    
                    {/* CARD 4: Conteúdo superior direito */}
                    <div className="card border-0 shadow-sm rounded-3" style={{minHeight:'290px'}}>
                        <div className="card-body" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <h5 className="card-title fs-6 fw-bold text-uppercase mb-4" style={{ color: '#2C3E50' }}>
                                {isProfessionalPlan ? '5 pacientes mais atendidos no mês' : 'Planos mais Ultilizados na Semana'}
                            </h5>

                            <div style={{ fontSize: '14px' }}>
                                {isProfessionalPlan ? (
                                    summary.professionalTopPatientsMonth.length === 0 ? (
                                        <div className="text-muted">Nenhum atendimento com status Atendido no mês vigente.</div>
                                    ) : (
                                        (() => {
                                            const max = Math.max(...summary.professionalTopPatientsMonth.map((p) => p.atendimentos), 1);
                                            return summary.professionalTopPatientsMonth.map((patient) => (
                                                <div key={patient.patientId || patient.patientName} className="mb-3 pb-2 border-bottom">
                                                    <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                                                        <div style={{ minWidth: 0, maxWidth: '62%', fontSize: '14px', fontWeight: 600 }} className="text-truncate" title={patient.patientName}>
                                                            {patient.patientName}
                                                        </div>
                                                        <div style={{ minWidth: '48px', textAlign: 'right', fontWeight: 700 }}>
                                                            {patient.atendimentos}
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ background: '#F1F3F5', height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${Math.round((patient.atendimentos / max) * 100)}%`, height: '10px', background: '#1E6B65' }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-end mt-1">
                                                        <div style={{ minWidth: '132px', textAlign: 'right', fontSize: '12px', color: '#44525f' }}>
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
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CARD 5: Conteúdo inferior direito */}
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-body" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <div className="mb-4">
                                <h5 className="card-title fs-6 fw-bold text-uppercase m-0" style={{ color: '#2C3E50' }}>
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
                                                            <strong style={{ color: '#1E6B65' }}>{formatCurrencyBRL(month.estimativa)}</strong>
                                                        </div>
                                                        <small className="text-muted d-block mb-1">Atendidos: {month.atendimentos}</small>
                                                        <div className="progress" style={{ height: '8px' }}>
                                                            <div
                                                                className="progress-bar"
                                                                role="progressbar"
                                                                aria-label={`Retorno estimado de ${month.label}`}
                                                                aria-valuenow={percentage}
                                                                aria-valuemin="0"
                                                                aria-valuemax="100"
                                                                style={{ width: `${percentage}%`, backgroundColor: '#1E6B65' }}
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
                                </>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
        </>
    )
}