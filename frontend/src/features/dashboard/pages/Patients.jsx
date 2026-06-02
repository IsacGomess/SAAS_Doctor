import api from "../../../services/api";
import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { createWaitingLineEntry, getWaitingLine } from "../../../features/waiting-line/services/waitingLineService";

export const Patients = () => {
  const auth = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addingPatientId, setAddingPatientId] = useState(null);

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [observations, setObservations] = useState("");
  const [isPresent, setIsPresent] = useState(true);

  const searchPatients = async () => {
      try {
        setLoading(true);

        const response = await api.get("/api/patients/atendance-list");
        setPatients(response.data.patients || []);
      } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    if (auth.isLoading) return;
    searchPatients();
  }, [auth.isLoading]);

  const dataBaseCadaster = async (e) => {
    e.preventDefault();
    const newPatient = { name, cpf, phone, observations, isPresent };

    try {
      await api.post("/api/patients/register-patient", newPatient);
      setShowForm(false);
      setName("");
      setCpf("");
      setPhone("");
      setObservations("");
      setIsPresent(true);
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
    }
  };

  const handleAddToWaitingLine = async (paciente) => {
    if (!auth.userId) {
      alert('Você precisa estar autenticado para adicionar pacientes à fila.');
      return;
    }

    try {
      setAddingPatientId(paciente._id);
      // Verifica se já existe entrada do mesmo paciente no mesmo dia
      try {
        const listResp = await getWaitingLine({ clinicArea: auth.clinicArea });
        const todays = (listResp.waitingLine || []).filter(entry => {
          const pid = entry.patientId && (entry.patientId._id || entry.patientId);
          if (!pid) return false;
          if (pid.toString() !== paciente._id.toString()) return false;
          const checkIn = entry.checkInAt || entry.calledAt || entry.attendedAt;
          if (!checkIn) return false;
          const d = new Date(checkIn);
          const today = new Date();
          return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && entry.status !== 'finalizado' && entry.status !== 'cancelado';
        });
        if (todays.length > 0) {
          alert('Este paciente já foi inserido na fila hoje.');
          setAddingPatientId(null);
          return;
        }
      } catch (err) {
        // Se falhar a verificação, seguir com criação (backend deve proteger também)
        console.warn('Falha ao verificar duplicatas na fila:', err);
      }
      const payload = {
        patientId: paciente._id,
        assignedTo: auth.userId,
        clinicArea: auth.clinicArea || undefined,
        source: 'avulso'
      };

      await createWaitingLineEntry(payload);
      alert(`Paciente ${paciente.name} adicionado à fila de espera.`);
    } catch (error) {
      console.error('Erro ao adicionar paciente à fila de espera:', error);
      alert('Não foi possível adicionar o paciente à fila. Tente novamente.');
    } finally {
      setAddingPatientId(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2">Buscando pacientes...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid pt-5 ps-0 pe-1 w-100" style={{ minHeight: '100%' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0" style={{ color: '#2C3E50' }}>Pacientes</h2>
          <p className="text-muted m-0">Gerencie os prontuários e cadastros da sua clínica</p>
        </div>
        {!showForm && (
          <button
            className="btn text-white px-4 py-2 shadow-sm"
            style={{ backgroundColor: '#1E6B65' }}
            onClick={() => setShowForm(true)}
          >
            + Novo Paciente
          </button>
        )}
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm rounded-3 mb-4 animate__animated animate__fadeIn">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3" style={{ color: '#1E6B65' }}>Cadastrar Novo Paciente</h5>
            <form onSubmit={dataBaseCadaster}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted small fw-bold">Nome Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted small fw-bold">CPF</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted small fw-bold">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(81) 99999-9999"
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted small fw-bold">Observações</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    maxLength={70}
                    placeholder="Observações sobre o paciente"
                  />
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light px-3" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }}>
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {patients.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-3 text-center py-5">
          <div className="card-body py-5">
            <div className="fs-1 mb-3">👥</div>
            <h4 className="fw-bold text-dark">Nenhum paciente cadastrado</h4>
            <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
              Você ainda não possui pacientes vinculados ao seu perfil. Comece cadastrando o seu primeiro paciente agora mesmo!
            </p>
            {!showForm && (
              <button
                className="btn text-white mt-2 px-4 shadow-sm"
                style={{ backgroundColor: '#1E6B65' }}
                onClick={() => setShowForm(true)}
              >
                Cadastrar meu primeiro paciente
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light">
                  <tr>
                    <th>Nome do Paciente</th>
                    <th>CPF</th>
                    <th>Contato</th>
                    <th>Observações</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((paciente) => (
                    <tr key={paciente._id}>
                      <td>
                        <div className="fw-bold text-dark">{paciente.name}</div>
                      </td>
                      <td className="text-muted">{paciente.cpf}</td>
                      <td className="text-muted">📞 {paciente.phone}</td>
                      <td className="text-muted">{paciente.observations}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-secondary me-2">Ver Histórico</button>
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          disabled={addingPatientId === paciente._id}
                          onClick={() => handleAddToWaitingLine(paciente)}
                        >
                          {addingPatientId === paciente._id ? 'Adicionando...' : 'Adicionar à Fila'}
                        </button>
                        <button className="btn btn-sm text-white" style={{ backgroundColor: '#1E6B65' }}>
                          Abrir Prontuário
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
