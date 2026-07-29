import api from "../../../services/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { createWaitingLineEntry, getWaitingLine } from "../../../features/waiting-line/services/waitingLineService";

export const Patients = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addingPatientId, setAddingPatientId] = useState(null);

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [idade, setIdade] = useState("");
  const [observations, setObservations] = useState("");
  const [isPresent, setIsPresent] = useState(true);
  const [convenios, setConvenios] = useState([]);
  const [selectedConvenioId, setSelectedConvenioId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

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

  const fetchConvenios = async () => {
    if (!auth.clinicaId) return;
    try {
      const response = await api.get("/api/convenios/list");
      setConvenios(response.data.convenios || []);
    } catch (error) {
      console.error("Erro ao buscar convênios:", error);
      setConvenios([]);
    }
  };

  useEffect(() => {
    if (auth.isLoading) return;
    fetchConvenios();
  }, [auth.isLoading, auth.clinicaId]);

  const getConvenioLabel = (paciente) => {
    if (!paciente?.convenioId) return 'Particular';

    const convenio = convenios.find(
      (c) => c._id === paciente.convenioId || c._id === paciente.convenioId?._id
    );

    return convenio?.nome || 'Particular';
  };

  useEffect(() => {
    if (auth.isLoading) return;
    searchPatients();
  }, [auth.isLoading]);

  const filteredPatients = patients.filter((paciente) => {
  const term = (searchText || "").trim().toLowerCase();
  if (term === "") return true;

  const nomePaciente = (paciente.name || "").toLowerCase();
  const cpfPaciente = String(paciente.cpf || "").replace(/\D/g, "");
  const termNumeros = term.replace(/\D/g, "");

  const bateNoNome = nomePaciente.includes(term);
  const bateNoCpf = termNumeros !== "" && cpfPaciente.includes(termNumeros);

  return bateNoNome || bateNoCpf;
});

  const dataBaseCadaster = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const newPatient = { 
      name, 
      cpf, 
      phone, 
      idade: idade !== '' ? Number(idade) : undefined,
      observations, 
      isPresent,
      convenioId: selectedConvenioId || null
    };

    try {
      await api.post("/api/patients/register-patient", newPatient);
      setFormSuccess("✅ Paciente cadastrado com sucesso!");
      setShowForm(false);
      setName("");
      setCpf("");
      setPhone("");
      setIdade("");
      setObservations("");
      setIsPresent(true);
      setSelectedConvenioId("");
      searchPatients(); // Atualiza a lista de pacientes
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao cadastrar paciente';
      setFormError(`❌ ${errorMsg}`);
    }
  };

  const handleAddToWaitingLine = async (paciente) => {
    try {
      setAddingPatientId(paciente._id);
      
      // 1. Verifica se já existe entrada do mesmo paciente no mesmo dia
      try {
        const listResp = await getWaitingLine({ clinicArea: auth.clinicArea });
        const todays = (listResp.waitingLine || listResp || []).filter(entry => {
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
        console.warn('Falha ao verificar duplicatas na fila:', err);
      }

      // 2. Monta o Payload Limpo (Deixando o backend identificar o médico pelo Cookie)
      // 🚀 Atualize APENAS o bloco do payload no seu Patients.jsx:
    const payload = {
      patientId: paciente._id,
      clinicaId: auth.clinicaId || localStorage.getItem('clinicaId'), 
      clinicArea: auth.clinicArea || localStorage.getItem('clinicArea') || undefined, // 💡 Força pegar o que estiver salvo
      assignedTo: auth.userId || undefined, // Se o seu back exigir o ID do médico no corpo da requisição
      source: 'avulso'
    };

      // 3. Faz o disparo usando o serviço que já consome nossa instância com cookies
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
    <div className="container-fluid pt-5 ps-1 pe-0 w-100" style={{ minHeight: '100%' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold m-0" style={{ color: '#2C3E50' }}>Pacientes</h2>
          <p className="text-muted m-0">Gerencie os prontuários e cadastros da sua clínica</p>
        </div>
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 w-100 w-md-auto">
          <input
            type="search"
            className="form-control"
            style={{ minWidth: '220px', maxWidth: '320px' }}
            placeholder="Buscar por nome ou CPF"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
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
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm rounded-3 mb-4 animate__animated animate__fadeIn">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3" style={{ color: '#1E6B65' }}>Cadastrar Novo Paciente</h5>
            {formError && (
              <div className="alert alert-danger mb-3" role="alert">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="alert alert-success mb-3" role="alert">
                {formSuccess}
              </div>
            )}
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
                <div className="col-12 col-md-2">
                  <label className="form-label text-muted small fw-bold">Idade</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    max={150}
                    value={idade}
                    onChange={(e) => setIdade(e.target.value)}
                    placeholder="Idade"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted small fw-bold">Observações</label>
                  <input
                    type="text"
                    className="form-control"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    maxLength={70}
                    placeholder="Observações sobre o paciente"
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted small fw-bold">Plano de Saúde</label>
                  <select
                    className="form-select"
                    value={selectedConvenioId}
                    onChange={(e) => setSelectedConvenioId(e.target.value)}
                  >
                    <option value="">Particular (Sem Convênio)</option>
                    {convenios.map((c) => (
                      <option key={c._id} value={c._id}>{c.nome}</option>
                    ))}
                  </select>
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

      {filteredPatients.length === 0 ? (
      <div className="card border-0 shadow-sm rounded-3 text-center py-5">
        <div className="card-body py-5">
          <div className="fs-1 mb-3">🔍</div>
          <h4 className="fw-bold text-dark">Nenhum paciente encontrado</h4>
          <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
            {searchText ? `Não encontramos resultados para "${searchText}"` : "Você ainda não possui pacientes vinculados ao seu perfil."}
          </p>
          {!showForm && !searchText && (
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
                  <th>Idade</th>
                  <th>Contato</th>
                  <th>Observações</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((paciente) => (
                  <tr key={paciente._id}>
                    <td>
                      <div className="fw-bold text-dark">{paciente.name}</div>
                      <small className="text-muted d-block">
                        Plano: {getConvenioLabel(paciente)}
                      </small>
                    </td>
                    <td className="text-muted">{paciente.cpf}</td>
                    <td className="text-muted">{paciente.idade ?? '-'}</td>
                    <td className="text-muted">📞 {paciente.phone}</td>
                    <td className="text-muted">{paciente.observations}</td>
                    <td className="text-end">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => navigate(`/dashboard/patients/${paciente._id}/history`)}
                        >
                          Prontuário 
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          disabled={addingPatientId === paciente._id}
                          onClick={() => handleAddToWaitingLine(paciente)}
                        >
                          {addingPatientId === paciente._id ? 'Adicionando...' : 'Add à Fila de espera'}
                        </button>
                      </div>
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
