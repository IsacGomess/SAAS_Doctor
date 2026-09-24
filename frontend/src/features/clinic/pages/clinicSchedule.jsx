import { Fragment, useEffect, useState } from 'react';
import { getPatientAttendanceList } from '../../medical-record/services/medicalRecordService';
import { createAppointment, getAppointments, updateAppointmentStatus } from '../services/appointmentService';
import { createWaitingLineEntry, getWaitingLine } from '../../waiting-line/services/waitingLineService';
import { useAuth } from '../../../hooks/useAuth';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import './clinicSchedule.css';

const DEFAULT_CLINIC_AREA = 'Geral';

const ClinicSchedule = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingPatientId, setAddingPatientId] = useState(null);
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
  const { clinicArea, clinicaId, userId } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Estado do formulário de marcação
  const [scheduleForm, setScheduleForm] = useState({
    patientId: '',
    time: '',
    notes: '',
    isRecurring: false
  });

  // Carrega pacientes para o <select> e os agendamentos do dia
  const loadScheduleData = async () => {
    setLoading(true);
    try {
      const patientList = await getPatientAttendanceList();
      setPatients(patientList);

      const appointmentList = await getAppointments(selectedDate);
      setAppointments(appointmentList);
    } catch (err) {
      console.error('Erro ao carregar dados da agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Junta o dia selecionado com o horário digitado no form
      const fullDateTime = `${selectedDate}T${scheduleForm.time}:00`;
      
      const creationResult = await createAppointment({
        patientId: scheduleForm.patientId,
        appointmentDate: fullDateTime,
        notes: scheduleForm.notes,
        isRecurring: scheduleForm.isRecurring
      });

      // Limpa formulário e recarrega a lista
      setScheduleForm({ patientId: '', time: '', notes: '', isRecurring: false });
      await loadScheduleData();
      if (creationResult?.createdCount > 1) {
        alert(`Agendamento recorrente criado com sucesso (${creationResult.createdCount} ocorrências nos próximos 30 dias).`);
      } else {
        alert('Agendamento realizado com sucesso!');
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message;
      alert('Erro ao agendar: ' + (apiMessage || err?.message || 'Tente novamente'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      await loadScheduleData(); // Atualiza a tela
    } catch {
      alert('Erro ao atualizar status');
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

      // Uma fila sem área selecionada deve sempre ser registrada na área geral.
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
        // Este é o valor aceito pelo validator da API para agendamento.
        source: 'consulta_agendada'
      };

      const createdEntry = await createWaitingLineEntry(payload);
      if (!createdEntry?.success && !createdEntry?.entry) {
        throw new Error('A API não confirmou a inclusão do paciente na fila.');
      }
      alert(`Paciente ${appointment.patientId?.name || 'Paciente'} adicionado à fila de espera.`);
    } catch (error) {
      console.error('Erro ao adicionar paciente à fila de espera:', error);
      alert('Não foi possível adicionar o paciente à fila. Tente novamente.');
    } finally {
      setAddingPatientId(null);
    }
  };

  const toggleDetails = (appointmentId) => {
    setExpandedAppointmentId((current) => (current === appointmentId ? null : appointmentId));
  };

  const getStatusBadgeMeta = (status) => {
    const badges = {
      agendado: { label: 'Agendado', className: 'bg-primary' },
      confirmado: { label: 'Confirmado', className: 'bg-success' },
      cancelado: { label: 'Cancelado', className: 'bg-danger' },
      atendido: { label: 'Atendido', className: 'bg-secondary' }
    };

    return badges[status] || { label: status, className: 'bg-light text-dark' };
  };

  const listTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: 'easeOut' };

  const detailTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: 'easeOut' };

  const isTodaySelected = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="container-fluid pt-5 ps-1 pe-0 w-100 schedule-page">
      {/* Cabeçalho */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div className="schedule-heading-wrap">
          <h2 className="fw-bold m-0 schedule-title">Agenda da Clínica</h2>
          <p className="text-muted m-0 schedule-subtitle">Gerencie os horários e consultas dos seus pacientes.</p>
        </div>
        {/* Filtro de Data Global */}
        <div className="d-flex align-items-center gap-2 schedule-date-filter">
          <label className="fw-bold text-muted small m-0 text-nowrap">Visualizar Dia:</label>
          <input
            type="date"
            className="form-control shadow-sm schedule-date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Coluna Esquerda - Novo Agendamento */}
        <div className="col-12 col-lg-4">
          <motion.div
            className="card border-0 shadow-sm rounded-3 schedule-panel-card"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={listTransition}
          >
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Novo Agendamento</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Paciente</label>
                  <select
                    className="form-select schedule-input"
                    value={scheduleForm.patientId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, patientId: e.target.value })}
                    required
                  >
                    <option value="">Selecione o paciente...</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Horário da Consulta</label>
                  <input
                    type="time"
                    className="form-control schedule-input"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold">Observações / Motivo</label>
                  <textarea
                    className="form-control schedule-input"
                    rows="3"
                    placeholder="Ex: Primeira consulta, Retorno de exames..."
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  />
                </div>

                <div className="mb-4">
                  <div className="form-check schedule-recurring-check">
                    <input
                      id="recurring-appointment"
                      className="form-check-input"
                      type="checkbox"
                      checked={scheduleForm.isRecurring}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, isRecurring: e.target.checked })}
                    />
                    <label className="form-check-label text-muted small fw-semibold" htmlFor="recurring-appointment">
                      Atendimento recorrente
                    </label>
                  </div>
                  {scheduleForm.isRecurring && (
                    <small className="text-muted d-block mt-2">
                      O sistema criará ocorrências semanais no mesmo dia e horário pelos próximos 30 dias.
                    </small>
                  )}
                </div>

                <button type="submit" className="btn text-white w-100 py-2 shadow-sm" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                  {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Coluna Direita - Agenda / Cronograma do Dia */}
        <div className="col-12 col-lg-8">
          <motion.div
            className="card border-0 shadow-sm rounded-3 schedule-panel-card"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.06, ease: 'easeOut' }}
          >
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 schedule-list-title" style={{ color: '#1E6B65' }}>
                Horários Solicitados para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </h5>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status"></div>
                  <p className="mt-2 text-muted">Buscando horários...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div className="fs-1 mb-2">📅</div>
                  <p>Nenhum paciente agendado para este dia.</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover align-middle m-0 schedule-table">
                    <thead className="table-light">
                      <tr>
                        <th>Horário</th>
                        <th>Paciente</th>
                        <th>Status</th>
                        <th className="text-end">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt, index) => {
                        const horaFormatada = new Date(appt.appointmentDate).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        const statusMeta = getStatusBadgeMeta(appt.status);
                        const isExpanded = expandedAppointmentId === appt._id;

                        return (
                          <Fragment key={`desktop-${appt._id}`}>
                            <motion.tr
                              key={appt._id}
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ ...listTransition, delay: prefersReducedMotion ? 0 : index * 0.03 }}
                            >
                              <td className="fw-bold text-dark fs-5" style={{ width: '110px' }}>
                                {horaFormatada}
                              </td>
                              <td>
                                <div className="fw-bold text-dark">{appt.patientId?.name || 'Paciente Não Identificado'}</div>
                                <small className="text-muted d-block">{appt.notes || 'Sem observações'}</small>
                              </td>
                              <td>
                                <AnimatePresence mode="wait" initial={false}>
                                  <motion.span
                                    key={`${appt._id}-${appt.status}`}
                                    className={`badge ${statusMeta.className}`}
                                    initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                                    transition={detailTransition}
                                  >
                                    {statusMeta.label}
                                  </motion.span>
                                </AnimatePresence>
                              </td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-secondary schedule-touch-btn"
                                  onClick={() => toggleDetails(appt._id)}
                                  aria-expanded={isExpanded}
                                  aria-controls={`appointment-details-${appt._id}`}
                                >
                                  {isExpanded ? 'Fechar detalhes' : 'Ver detalhes'}
                                </button>
                              </td>
                            </motion.tr>

                            <tr key={`${appt._id}-details-row`}>
                              <td colSpan="4" className="p-0 border-0">
                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      id={`appointment-details-${appt._id}`}
                                      className="schedule-row-details"
                                      initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                                      transition={detailTransition}
                                    >
                                      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
                                        <small className="text-muted schedule-detail-note">
                                          {appt.notes || 'Sem observações'}
                                        </small>

                                        <div className="d-flex flex-wrap gap-2">
                                          {isTodaySelected && ['agendado', 'confirmado'].includes(appt.status) && (
                                            <button
                                              className="btn btn-sm btn-outline-success schedule-touch-btn"
                                              onClick={() => handleAddToWaitingLine(appt)}
                                              disabled={addingPatientId === appt._id}
                                            >
                                              {addingPatientId === appt._id ? 'Adicionando...' : 'Add à Fila de espera'}
                                            </button>
                                          )}

                                          <button className="btn btn-sm btn-outline-success schedule-touch-btn" onClick={() => handleStatusChange(appt._id, 'confirmado')}>
                                            Confirmar
                                          </button>
                                          <button className="btn btn-sm btn-outline-secondary schedule-touch-btn" onClick={() => handleStatusChange(appt._id, 'atendido')}>
                                            Marcar como Atendido
                                          </button>
                                          <button className="btn btn-sm btn-outline-danger schedule-touch-btn" onClick={() => handleStatusChange(appt._id, 'cancelado')}>
                                            Cancelar Agendamento
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </td>
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                    </table>
                  </div>

                  <div className="d-md-none schedule-mobile-list">
                    {appointments.map((appt, index) => {
                      const horaFormatada = new Date(appt.appointmentDate).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const statusMeta = getStatusBadgeMeta(appt.status);
                      const isExpanded = expandedAppointmentId === appt._id;

                      return (
                        <motion.article
                          className="schedule-mobile-item"
                          key={`mobile-${appt._id}`}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...listTransition, delay: prefersReducedMotion ? 0 : index * 0.04 }}
                        >
                          <div className="schedule-mobile-top">
                            <strong className="schedule-mobile-time">{horaFormatada}</strong>
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.span
                                key={`mobile-${appt._id}-${appt.status}`}
                                className={`badge ${statusMeta.className}`}
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                                transition={detailTransition}
                              >
                                {statusMeta.label}
                              </motion.span>
                            </AnimatePresence>
                          </div>

                          <div className="schedule-mobile-patient">{appt.patientId?.name || 'Paciente Não Identificado'}</div>
                          <small className="text-muted d-block">{appt.notes || 'Sem observações'}</small>

                          <button
                            className="btn btn-outline-secondary schedule-touch-btn w-100 mt-3"
                            onClick={() => toggleDetails(appt._id)}
                            aria-expanded={isExpanded}
                            aria-controls={`appointment-mobile-details-${appt._id}`}
                          >
                            {isExpanded ? 'Fechar detalhes' : 'Abrir detalhes e ações'}
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                id={`appointment-mobile-details-${appt._id}`}
                                className="schedule-mobile-details"
                                initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                                transition={detailTransition}
                              >
                                {isTodaySelected && ['agendado', 'confirmado'].includes(appt.status) && (
                                  <button
                                    className="btn btn-outline-success schedule-touch-btn w-100"
                                    onClick={() => handleAddToWaitingLine(appt)}
                                    disabled={addingPatientId === appt._id}
                                  >
                                    {addingPatientId === appt._id ? 'Adicionando...' : 'Add à Fila de espera'}
                                  </button>
                                )}

                                <button className="btn btn-outline-success schedule-touch-btn w-100" onClick={() => handleStatusChange(appt._id, 'confirmado')}>
                                  Confirmar
                                </button>
                                <button className="btn btn-outline-secondary schedule-touch-btn w-100" onClick={() => handleStatusChange(appt._id, 'atendido')}>
                                  Marcar como Atendido
                                </button>
                                <button className="btn btn-outline-danger schedule-touch-btn w-100" onClick={() => handleStatusChange(appt._id, 'cancelado')}>
                                  Cancelar Agendamento
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClinicSchedule;