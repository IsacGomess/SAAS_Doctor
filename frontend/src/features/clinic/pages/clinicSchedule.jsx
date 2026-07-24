import { useEffect, useState } from 'react';
import { getPatientAttendanceList } from '../../medical-record/services/medicalRecordService';
import { createAppointment, getAppointments, updateAppointmentStatus } from '../services/appointmentService';
import { createWaitingLineEntry, getWaitingLine } from '../../waiting-line/services/waitingLineService';
import { useAuth } from '../../../hooks/useAuth';

const DEFAULT_CLINIC_AREA = 'Geral';

const ClinicSchedule = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingPatientId, setAddingPatientId] = useState(null);
  const { clinicArea, clinicaId, userId } = useAuth();

  // Estado do formulário de marcação
  const [scheduleForm, setScheduleForm] = useState({
    patientId: '',
    time: '',
    notes: ''
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
      
      await createAppointment({
        patientId: scheduleForm.patientId,
        appointmentDate: fullDateTime,
        notes: scheduleForm.notes
      });

      // Limpa formulário e recarrega a lista
      setScheduleForm({ patientId: '', time: '', notes: '' });
      await loadScheduleData();
      alert('Agendamento realizado com sucesso!');
    } catch (err) {
      alert('Erro ao agendar: ' + (err?.message || 'Tente novamente'));
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

  const getStatusBadge = (status) => {
    const badges = {
      agendado: <span className="badge bg-primary">Agendado</span>,
      confirmado: <span className="badge bg-success">Confirmado</span>,
      cancelado: <span className="badge bg-danger">Cancelado</span>,
      atendido: <span className="badge bg-secondary">Atendido</span>,
    };
    return badges[status] || <span className="badge bg-light text-dark">{status}</span>;
  };

  return (
    <div className="container-fluid pt-5 ps-1 pe-0 w-100">
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0" style={{ color: '#2C3E50' }}>Agenda da Clínica</h2>
          <p className="text-muted m-0">Gerencie os horários e consultas dos seus pacientes.</p>
        </div>
        {/* Filtro de Data Global */}
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold text-muted small m-0 text-nowrap">Visualizar Dia:</label>
          <input
            type="date"
            className="form-control shadow-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Coluna Esquerda - Novo Agendamento */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Novo Agendamento</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Paciente</label>
                  <select
                    className="form-select"
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
                    className="form-control"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold">Observações / Motivo</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Ex: Primeira consulta, Retorno de exames..."
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn text-white w-100 py-2 shadow-sm" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                  {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Agenda / Cronograma do Dia */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>
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
                <div className="table-responsive">
                  <table className="table table-hover align-middle m-0">
                    <thead className="table-light">
                      <tr>
                        <th>Horário</th>
                        <th>Paciente</th>
                        <th>Status</th>
                        <th className="text-end">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => {
                        const horaFormatada = new Date(appt.appointmentDate).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <tr key={appt._id}>
                            <td className="fw-bold text-dark fs-5" style={{ width: '100px' }}>
                              ⏰ {horaFormatada}
                            </td>
                            <td>
                              <div className="fw-bold text-dark">{appt.patientId?.name || 'Paciente Não Identificado'}</div>
                              <small className="text-muted d-block">{appt.notes || 'Sem observações'}</small>
                            </td>
                            <td>{getStatusBadge(appt.status)}</td>
                            <td className="text-end">
                              <div className="d-flex gap-2 justify-content-end align-items-center">
                                {selectedDate === new Date().toISOString().split('T')[0] && ['agendado', 'confirmado'].includes(appt.status) && (
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => handleAddToWaitingLine(appt)}
                                    disabled={addingPatientId === appt._id}
                                  >
                                    {addingPatientId === appt._id ? 'Adicionando...' : 'Add à Fila de espera'}
                                  </button>
                                )}
                                <div className="dropdown d-inline-block">
                                  <ul className="dropdown-menu dropdown-menu-end">
                                    <li><button className="dropdown-item text-success" onClick={() => handleStatusChange(appt._id, 'confirmado')}>Confirmar</button></li>
                                    <li><button className="dropdown-item text-secondary" onClick={() => handleStatusChange(appt._id, 'atendido')}>Marcar como Atendido</button></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item text-danger" onClick={() => handleStatusChange(appt._id, 'cancelado')}>Cancelar Agendamento</button></li>
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicSchedule;