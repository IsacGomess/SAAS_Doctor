import api from "../../../services/api";
import { useState, useEffect, Fragment } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { createWaitingLineEntry, getWaitingLine } from "../../../features/waiting-line/services/waitingLineService";
import { getSubscription } from "../../../services/billing";
import "./Patients.css";

const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getTodayDateValue = () => new Date().toISOString().slice(0, 10);

const formatCents = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / 100);
};

const normalizeMonth = (value) => {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : getCurrentMonthKey();
};

const MONTH_OPTIONS_PT = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" }
];

export const Patients = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
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
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editingPatientData, setEditingPatientData] = useState({
    name: "",
    cpf: "",
    phone: "",
    idade: "",
    observations: "",
    convenioId: ""
  });
  const [savingPatientId, setSavingPatientId] = useState(null);
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [financialSummary, setFinancialSummary] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState("");
  const [chargeDraft, setChargeDraft] = useState({
    description: "",
    periodicity: "mensal",
    referenceMonth: getCurrentMonthKey(),
    amount: "",
    dueDate: getTodayDateValue()
  });
  const [editingChargeId, setEditingChargeId] = useState(null);
  const [savingChargeId, setSavingChargeId] = useState(null);
  const [paymentChargeId, setPaymentChargeId] = useState(null);
  const [paymentDraft, setPaymentDraft] = useState({ amount: "", method: "pix", paidAt: getTodayDateValue() });
  const [savingPaymentChargeId, setSavingPaymentChargeId] = useState(null);

  const prefersReducedMotion = useReducedMotion();
  const isProfessionalPlan = subscriptionPlan === "professional";
  const normalizedSelectedMonth = normalizeMonth(selectedMonth);
  const selectedPeriodYear = normalizedSelectedMonth.slice(0, 4);
  const selectedPeriodMonth = normalizedSelectedMonth.slice(5, 7);

  useEffect(() => {
    let active = true;

    const loadSubscriptionPlan = async () => {
      try {
        const response = await getSubscription();
        if (!active) return;
        setSubscriptionPlan(response?.subscription?.plan || null);
      } catch {
        if (!active) return;
        setSubscriptionPlan(null);
      }
    };

    loadSubscriptionPlan();

    return () => {
      active = false;
    };
  }, []);

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

  const fetchPatients = async (page = 1, query = searchText) => {
    if (auth.isLoading) return;

    try {
      setLoading(true);
      const response = await api.get("/api/patients/list", {
        params: { page, limit: 20, search: query }
      });

      const result = response.data || {};
      setPatients(result.patients || []);
      setPagination({
        page: Number(result.page || page),
        limit: Number(result.limit || 20),
        total: Number(result.total || 0),
        totalPages: Number(result.totalPages || 1)
      });
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
      setPatients([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialSummary = async (patientId, month = selectedMonth) => {
    if (!patientId) return;

    const validMonth = normalizeMonth(month);
    setFinancialLoading(true);
    setFinancialError("");

    try {
      const response = await api.get(`/api/patients/${patientId}/financial-summary`, { params: { month: validMonth } });
      setFinancialSummary(response.data.summary || { charges: [] });
    } catch (error) {
      console.error("Erro ao buscar financeiro do paciente:", error);
      setFinancialSummary(null);
      setFinancialError(error.response?.data?.message || "Não foi possível carregar os pagamentos deste paciente.");
    } finally {
      setFinancialLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isLoading) return;
    fetchConvenios();
    fetchPatients(1, searchText);
  }, [auth.isLoading, auth.clinicaId]);

  useEffect(() => {
    if (!expandedPatientId) return;
    fetchFinancialSummary(expandedPatientId, selectedMonth);
  }, [selectedMonth, expandedPatientId]);

  const getConvenioLabel = (paciente) => {
    if (!paciente?.convenioId) return "Particular";

    const convenio = convenios.find(
      (c) => c._id === paciente.convenioId || c._id === paciente.convenioId?._id
    );

    return convenio?.nome || "Particular";
  };

  const handleEditPatient = (paciente) => {
    setEditingPatientId(paciente._id);
    setEditingPatientData({
      name: paciente.name || "",
      cpf: paciente.cpf || "",
      phone: paciente.phone || "",
      idade: paciente.idade ?? "",
      observations: paciente.observations || "",
      convenioId: typeof paciente.convenioId === "string" ? paciente.convenioId : paciente.convenioId?._id || ""
    });
  };

  const handleCancelPatientEdit = () => {
    setEditingPatientId(null);
    setEditingPatientData({ name: "", cpf: "", phone: "", idade: "", observations: "", convenioId: "" });
  };

  const handleSavePatient = async () => {
    if (!editingPatientId) return;

    setSavingPatientId(editingPatientId);

    try {
      const payload = {
        name: editingPatientData.name.trim(),
        cpf: editingPatientData.cpf.replace(/\D/g, ""),
        phone: editingPatientData.phone.replace(/\D/g, ""),
        idade: editingPatientData.idade === "" ? null : Number(editingPatientData.idade),
        observations: editingPatientData.observations.trim(),
        convenioId: editingPatientData.convenioId || null
      };

      const response = await api.patch(`/api/patients/${editingPatientId}`, payload);
      const updatedPatient = response?.data?.patient;

      if (updatedPatient) {
        setPatients((prev) => prev.map((patient) => patient._id === editingPatientId ? { ...patient, ...updatedPatient } : patient));
      }

      setEditingPatientId(null);
      setEditingPatientData({ name: "", cpf: "", phone: "", idade: "", observations: "", convenioId: "" });
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);
      const apiMessage = error?.response?.data?.message || "Não foi possível salvar as alterações do paciente.";
      alert(apiMessage);
    } finally {
      setSavingPatientId(null);
    }
  };

  const dataBaseCadaster = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const newPatient = {
      name,
      cpf,
      phone,
      idade: idade !== "" ? Number(idade) : undefined,
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
      fetchPatients(1, searchText);
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      const errorMsg = error.response?.data?.message || error.message || "Erro ao cadastrar paciente";
      setFormError(`❌ ${errorMsg}`);
    }
  };

  const handleAddToWaitingLine = async (paciente) => {
    try {
      setAddingPatientId(paciente._id);

      try {
        const listResp = await getWaitingLine({ clinicArea: auth.clinicArea });
        const todays = (listResp.waitingLine || listResp || []).filter((entry) => {
          const pid = entry.patientId && (entry.patientId._id || entry.patientId);
          if (!pid) return false;
          if (pid.toString() !== paciente._id.toString()) return false;
          const checkIn = entry.checkInAt || entry.calledAt || entry.attendedAt;
          if (!checkIn) return false;
          const d = new Date(checkIn);
          const today = new Date();
          return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && entry.status !== "finalizado" && entry.status !== "cancelado";
        });
        if (todays.length > 0) {
          alert("Este paciente já foi inserido na fila hoje.");
          setAddingPatientId(null);
          return;
        }
      } catch (err) {
        console.warn("Falha ao verificar duplicatas na fila:", err);
      }

      const payload = {
        patientId: paciente._id,
        clinicaId: auth.clinicaId || localStorage.getItem("clinicaId"),
        clinicArea: auth.clinicArea || localStorage.getItem("clinicArea") || undefined,
        assignedTo: auth.userId || undefined,
        source: "avulso"
      };

      await createWaitingLineEntry(payload);
      alert(`Paciente ${paciente.name} adicionado à fila de espera.`);
    } catch (error) {
      console.error("Erro ao adicionar paciente à fila de espera:", error);
      alert("Não foi possível adicionar o paciente à fila. Tente novamente.");
    } finally {
      setAddingPatientId(null);
    }
  };

  const handleChargeSubmit = async (event) => {
    event.preventDefault();

    if (!expandedPatientId) return;

    const safeMonth = normalizeMonth(chargeDraft.referenceMonth || selectedMonth);
    const amountInCents = Math.round(Number(chargeDraft.amount) * 100);
    if (!chargeDraft.description.trim() || !chargeDraft.dueDate || !amountInCents) {
      alert("Preencha descrição, valor e vencimento da cobrança.");
      return;
    }

    setSavingChargeId(editingChargeId || "new");

    try {
      const payload = {
        description: chargeDraft.description.trim(),
        periodicity: chargeDraft.periodicity,
        referenceMonth: safeMonth,
        amountCents: amountInCents,
        dueDate: chargeDraft.dueDate
      };

      if (editingChargeId) {
        await api.patch(`/api/patients/${expandedPatientId}/charges/${editingChargeId}`, payload);
      } else {
        await api.post(`/api/patients/${expandedPatientId}/charges`, payload);
      }

      setEditingChargeId(null);
      setSelectedMonth(safeMonth);
      setChargeDraft({ description: "", periodicity: "mensal", referenceMonth: safeMonth, amount: "", dueDate: getTodayDateValue() });
      fetchFinancialSummary(expandedPatientId, safeMonth);
    } catch (error) {
      console.error("Erro ao salvar cobrança:", error);
      alert(error.response?.data?.message || "Não foi possível salvar a cobrança.");
    } finally {
      setSavingChargeId(null);
    }
  };

  const handlePaymentSubmit = async (chargeId) => {
    if (!expandedPatientId || !chargeId) return;

    const amountInCents = Math.round(Number(paymentDraft.amount) * 100);
    if (!amountInCents) {
      alert("Informe o valor do pagamento.");
      return;
    }

    setSavingPaymentChargeId(chargeId);

    try {
      await api.post(`/api/patients/${expandedPatientId}/charges/${chargeId}/payments`, {
        amountCents: amountInCents,
        method: paymentDraft.method,
        paidAt: paymentDraft.paidAt || getTodayDateValue()
      });

      setPaymentChargeId(null);
      setPaymentDraft({ amount: "", method: "pix", paidAt: getTodayDateValue() });
      fetchFinancialSummary(expandedPatientId, selectedMonth);
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      alert(error.response?.data?.message || "Não foi possível registrar o pagamento.");
    } finally {
      setSavingPaymentChargeId(null);
    }
  };

  const renderChargeStatus = (charge) => {
    if (charge.overdue && charge.status !== "pago") {
      return "Atrasado";
    }
    if (charge.status === "pago") return "Pago";
    if (charge.status === "parcial") return "Parcial";
    return "Pendente";
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
    <div className="patients-page container-fluid pt-5 ps-1 pe-0 w-100">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold m-0 patients-title">Pacientes</h2>
          <p className="text-muted m-0">Gerencie os prontuários, cadastros e pagamentos da sua clínica</p>
        </div>
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 w-100 w-md-auto">
          <input
            type="search"
            className="form-control patients-search-input"
            placeholder="Buscar por nome ou CPF"
            value={searchText}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearchText(nextValue);
              fetchPatients(1, nextValue);
            }}
          />
          {!showForm && (
            <button
              type="button"
              className="btn text-white px-4 py-2 shadow-sm patients-primary-btn"
              onClick={() => setShowForm(true)}
            >
              + Novo Paciente
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card border-0 rounded-4 mb-4 animate__animated animate__fadeIn patients-surface-card">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 patients-section-title">Cadastrar Novo Paciente</h5>
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
                <button type="submit" className="btn text-white px-4 patients-primary-btn">
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {patients.length === 0 ? (
        <div className="card border-0 rounded-4 text-center py-5 patients-surface-card">
          <div className="card-body py-5">
            <div className="fs-1 mb-3">🔍</div>
            <h4 className="fw-bold text-dark">Nenhum paciente encontrado</h4>
            <p className="text-muted mx-auto patients-empty-copy">
              {searchText ? `Não encontramos resultados para "${searchText}"` : "Você ainda não possui pacientes vinculados ao seu perfil."}
            </p>
            {!showForm && !searchText && (
              <button
                type="button"
                className="btn text-white mt-2 px-4 shadow-sm patients-primary-btn"
                onClick={() => setShowForm(true)}
              >
                Cadastrar meu primeiro paciente
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card border-0 rounded-4 patients-surface-card">
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0 patients-mobile-list patients-table">
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
                  {patients.map((paciente) => {
                    const isEditingThisPatient = editingPatientId === paciente._id;
                    const isExpanded = expandedPatientId === paciente._id;

                    return (
                      <Fragment key={paciente._id}>
                        <motion.tr
                          className={isEditingThisPatient ? "is-editing-patient" : ""}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
                        >
                          <td className="patient-mobile-name">
                            {isEditingThisPatient ? (
                              <div className="d-grid gap-2">
                                <input
                                  className="form-control patients-edit-input"
                                  value={editingPatientData.name}
                                  onChange={(event) => setEditingPatientData((prev) => ({ ...prev, name: event.target.value }))}
                                  placeholder="Nome do paciente"
                                />
                                <select
                                  className="form-select patients-edit-input"
                                  value={editingPatientData.convenioId}
                                  onChange={(event) => setEditingPatientData((prev) => ({ ...prev, convenioId: event.target.value }))}
                                >
                                  <option value="">Particular (Sem Convênio)</option>
                                  {convenios.map((convenio) => (
                                    <option key={convenio._id} value={convenio._id}>{convenio.nome}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <>
                                <div className="fw-bold text-dark">{paciente.name}</div>
                                <small className="text-muted d-block">
                                  Plano: {getConvenioLabel(paciente)}
                                </small>
                              </>
                            )}
                          </td>
                          <td className="text-muted patient-mobile-hidden">
                            {isEditingThisPatient ? (
                              <input
                                className="form-control patients-edit-input"
                                value={editingPatientData.cpf}
                                onChange={(event) => setEditingPatientData((prev) => ({ ...prev, cpf: event.target.value }))}
                                placeholder="CPF"
                              />
                            ) : (
                              paciente.cpf
                            )}
                          </td>
                          <td className="text-muted patient-mobile-hidden">
                            {isEditingThisPatient ? (
                              <input
                                type="number"
                                min={0}
                                max={150}
                                className="form-control patients-edit-input"
                                value={editingPatientData.idade}
                                onChange={(event) => setEditingPatientData((prev) => ({ ...prev, idade: event.target.value }))}
                                placeholder="Idade"
                              />
                            ) : (
                              paciente.idade ?? "-"
                            )}
                          </td>
                          <td className="text-muted patient-mobile-hidden">
                            {isEditingThisPatient ? (
                              <input
                                className="form-control patients-edit-input"
                                value={editingPatientData.phone}
                                onChange={(event) => setEditingPatientData((prev) => ({ ...prev, phone: event.target.value }))}
                                placeholder="Telefone"
                              />
                            ) : (
                              `📞 ${paciente.phone}`
                            )}
                          </td>
                          <td className="text-muted patient-mobile-hidden">
                            {isEditingThisPatient ? (
                              <input
                                className="form-control patients-edit-input"
                                value={editingPatientData.observations}
                                onChange={(event) => setEditingPatientData((prev) => ({ ...prev, observations: event.target.value }))}
                                placeholder="Observações"
                              />
                            ) : (
                              paciente.observations
                            )}
                          </td>
                          <td className="text-end patient-mobile-actions">
                            {isEditingThisPatient ? (
                              <div className="patients-edit-actions">
                                <button
                                  type="button"
                                  className="btn btn-sm text-white patients-primary-btn"
                                  onClick={handleSavePatient}
                                  disabled={savingPatientId === paciente._id}
                                >
                                  {savingPatientId === paciente._id ? "Salvando..." : "Salvar"}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={handleCancelPatientEdit}
                                  disabled={savingPatientId === paciente._id}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex flex-wrap justify-content-end gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => navigate(`/dashboard/patients/${paciente._id}/history`)}
                                >
                                  <i className="bi bi-journal-medical me-1" aria-hidden="true"></i>
                                  Prontuário
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEditPatient(paciente)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm patients-finance-btn"
                                  aria-expanded={isExpanded}
                                  aria-controls={`patient-payments-${paciente._id}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (isExpanded) {
                                      setExpandedPatientId(null);
                                      setFinancialSummary(null);
                                      return;
                                    }
                                    setExpandedPatientId(paciente._id);
                                    setSelectedMonth(getCurrentMonthKey());
                                    fetchFinancialSummary(paciente._id, getCurrentMonthKey());
                                  }}
                                >
                                  <i className="bi bi-currency-dollar me-1" aria-hidden="true"></i>
                                  Pagamentos
                                </button>
                                {!isProfessionalPlan && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success"
                                    disabled={addingPatientId === paciente._id}
                                    onClick={() => handleAddToWaitingLine(paciente)}
                                  >
                                    {addingPatientId === paciente._id ? "Adicionando..." : "Add à Fila de espera"}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </motion.tr>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.tr
                              initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
                            >
                              <td colSpan={6} className="patient-payment-panel-cell">
                                <div id={`patient-payments-${paciente._id}`} className="patient-payment-panel">
                                  <div className="patient-payment-header">
                                    <div className="patient-payment-identity">
                                      <small className="text-uppercase text-muted">Pagamentos</small>
                                      <h6 className="mb-0">{paciente.name}</h6>
                                      <small className="patient-payment-created-at">
                                        Cadastrado em {paciente?.createdAt ? new Date(paciente.createdAt).toLocaleDateString('pt-BR') : '—'}
                                      </small>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => {
                                        setExpandedPatientId(null);
                                        setFinancialSummary(null);
                                      }}
                                    >
                                      Fechar
                                    </button>
                                  </div>

                                  <div className="patient-payment-controls">
                                    <label className="patients-finance-field patients-finance-field-month">
                                      <span id={`patient-period-label-${paciente._id}`}>Período</span>
                                      <select
                                        aria-labelledby={`patient-period-label-${paciente._id}`}
                                        value={selectedPeriodMonth}
                                        onChange={(event) => {
                                          const nextMonth = `${selectedPeriodYear}-${event.target.value}`;
                                          setSelectedMonth(nextMonth);
                                          setChargeDraft((prev) => ({ ...prev, referenceMonth: nextMonth }));
                                        }}
                                      >
                                        {MONTH_OPTIONS_PT.map((monthOption) => (
                                          <option key={monthOption.value} value={monthOption.value}>
                                            {monthOption.label}
                                          </option>
                                        ))}
                                      </select>
                                      <small className="patients-finance-period-year">Ano {selectedPeriodYear}</small>
                                    </label>
                                  </div>

                                  {financialLoading ? (
                                    <div className="patients-payment-loading">Carregando pagamentos...</div>
                                  ) : financialError ? (
                                    <div className="alert alert-danger mt-3 mb-0" role="alert">{financialError}</div>
                                  ) : financialSummary ? (
                                    <>
                                      <div className="patient-finance-summary-grid">
                                        <div className="patient-finance-metric">
                                          <span>Atendimentos no mês</span>
                                          <strong>{financialSummary.attendedInPeriod ?? 0}</strong>
                                        </div>
                                        <div className="patient-finance-metric">
                                          <span>Total atendimentos</span>
                                          <strong>{financialSummary.attendedTotal ?? 0}</strong>
                                        </div>
                                        <div className="patient-finance-metric">
                                          <span>Total cobrado</span>
                                          <strong>{formatCents(financialSummary.totalCharged || 0)}</strong>
                                        </div>
                                        <div className="patient-finance-metric">
                                          <span>Total recebido</span>
                                          <strong>{formatCents(financialSummary.totalReceived || 0)}</strong>
                                        </div>
                                        <div className="patient-finance-metric patient-finance-metric-highlight">
                                          <span>Saldo pendente</span>
                                          <strong>{formatCents(financialSummary.balancePending || 0)}</strong>
                                        </div>
                                      </div>

                                      <div className="patient-charge-form">
                                        <div className="patient-charge-form-header">
                                          <h6>{editingChargeId ? "Editar cobrança" : "Adicionar cobrança"}</h6>
                                        </div>
                                        <form onSubmit={handleChargeSubmit} className="row g-2">
                                          <div className="col-12 col-md-5">
                                            <label className="patients-finance-field">
                                              <span>Descrição</span>
                                              <input
                                                type="text"
                                                value={chargeDraft.description}
                                                onChange={(event) => setChargeDraft((prev) => ({ ...prev, description: event.target.value }))}
                                                placeholder="Consulta, mensalidade..."
                                              />
                                            </label>
                                          </div>
                                          <div className="col-12 col-md-2">
                                            <label className="patients-finance-field">
                                              <span>Periodicidade</span>
                                              <select
                                                value={chargeDraft.periodicity}
                                                onChange={(event) => setChargeDraft((prev) => ({ ...prev, periodicity: event.target.value }))}
                                              >
                                                <option value="avulsa">Avulsa</option>
                                                <option value="semanal">Semanal</option>
                                                <option value="mensal">Mensal</option>
                                              </select>
                                            </label>
                                          </div>
                                          <div className="col-12 col-md-2">
                                            <label className="patients-finance-field patients-finance-field-month">
                                              <span>Período</span>
                                              <input
                                                type="month"
                                                value={chargeDraft.referenceMonth || selectedMonth}
                                                onChange={(event) => {
                                                  const nextMonth = event.target.value;
                                                  setChargeDraft((prev) => ({ ...prev, referenceMonth: nextMonth }));
                                                  setSelectedMonth(nextMonth);
                                                }}
                                              />
                                            </label>
                                          </div>
                                          <div className="col-12 col-md-2">
                                            <label className="patients-finance-field">
                                              <span>Valor</span>
                                              <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={chargeDraft.amount}
                                                onChange={(event) => setChargeDraft((prev) => ({ ...prev, amount: event.target.value }))}
                                                placeholder="0,00"
                                              />
                                            </label>
                                          </div>
                                          <div className="col-12 col-md-1">
                                            <label className="patients-finance-field">
                                              <span>Vencimento</span>
                                              <input
                                                type="date"
                                                value={chargeDraft.dueDate}
                                                onChange={(event) => setChargeDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                                              />
                                            </label>
                                          </div>
                                          <div className="col-12 d-flex justify-content-end gap-2 mt-1">
                                            {editingChargeId && (
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => {
                                                  setEditingChargeId(null);
                                                  setChargeDraft({ description: "", periodicity: "mensal", referenceMonth: selectedMonth, amount: "", dueDate: getTodayDateValue() });
                                                }}
                                              >
                                                Cancelar
                                              </button>
                                            )}
                                            <button type="submit" className="btn btn-sm text-white patients-primary-btn" disabled={savingChargeId === (editingChargeId || "new")}>
                                              {savingChargeId === (editingChargeId || "new") ? "Salvando..." : editingChargeId ? "Salvar cobrança" : "Adicionar cobrança"}
                                            </button>
                                          </div>
                                        </form>
                                      </div>

                                      <div className="patient-charge-list">
                                        {(financialSummary.charges || []).length === 0 ? (
                                          <div className="patient-charge-empty">Nenhuma cobrança registrada para este período.</div>
                                        ) : (
                                          (financialSummary.charges || []).map((charge) => {
                                            const paidAmount = (charge.payments || []).reduce((sum, payment) => sum + Number(payment.amountCents || 0), 0);
                                            const remaining = Number(charge.amountCents || 0) - paidAmount;
                                            const statusLabel = renderChargeStatus(charge);

                                            return (
                                              <div className="patient-charge-item" key={charge._id}>
                                                <div className="patient-charge-header-row">
                                                  <div>
                                                    <strong>{charge.description}</strong>
                                                    <small>
                                                      {charge.periodicity} • {charge.referenceMonth} • Vence em {new Date(charge.dueDate).toLocaleDateString("pt-BR")}
                                                    </small>
                                                  </div>
                                                  <span className={`patient-charge-status patient-charge-status-${charge.status === "pago" ? "paid" : charge.status === "parcial" ? "partial" : charge.overdue ? "late" : "pending"}`}>
                                                    {statusLabel}
                                                  </span>
                                                </div>

                                                <div className="patient-charge-metrics">
                                                  <div><span>Valor</span><strong>{formatCents(charge.amountCents)}</strong></div>
                                                  <div><span>Pago</span><strong>{formatCents(paidAmount)}</strong></div>
                                                  <div><span>Pendente</span><strong>{formatCents(remaining)}</strong></div>
                                                </div>

                                                <div className="patient-charge-actions">
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {
                                                      setEditingChargeId(charge._id);
                                                      setChargeDraft({
                                                        description: charge.description,
                                                        periodicity: charge.periodicity,
                                                        referenceMonth: charge.referenceMonth,
                                                        amount: (Number(charge.amountCents) / 100).toFixed(2),
                                                        dueDate: new Date(charge.dueDate).toISOString().slice(0, 10)
                                                      });
                                                    }}
                                                  >
                                                    Editar
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => {
                                                      setPaymentChargeId(charge._id);
                                                      setPaymentDraft({ amount: "", method: "pix", paidAt: getTodayDateValue() });
                                                    }}
                                                  >
                                                    Registrar pagamento
                                                  </button>
                                                </div>

                                                {paymentChargeId === charge._id && (
                                                  <div className="patient-payment-form">
                                                    <div className="row g-2 align-items-end">
                                                      <div className="col-12 col-md-4">
                                                        <label className="patients-finance-field">
                                                          <span>Valor pago</span>
                                                          <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={paymentDraft.amount}
                                                            onChange={(event) => setPaymentDraft((prev) => ({ ...prev, amount: event.target.value }))}
                                                            placeholder="0,00"
                                                          />
                                                        </label>
                                                      </div>
                                                      <div className="col-12 col-md-3">
                                                        <label className="patients-finance-field">
                                                          <span>Forma</span>
                                                          <select
                                                            value={paymentDraft.method}
                                                            onChange={(event) => setPaymentDraft((prev) => ({ ...prev, method: event.target.value }))}
                                                          >
                                                            <option value="pix">Pix</option>
                                                            <option value="dinheiro">Dinheiro</option>
                                                            <option value="cartao">Cartão</option>
                                                          </select>
                                                        </label>
                                                      </div>
                                                      <div className="col-12 col-md-3">
                                                        <label className="patients-finance-field">
                                                          <span>Data</span>
                                                          <input
                                                            type="date"
                                                            value={paymentDraft.paidAt}
                                                            onChange={(event) => setPaymentDraft((prev) => ({ ...prev, paidAt: event.target.value }))}
                                                          />
                                                        </label>
                                                      </div>
                                                      <div className="col-12 col-md-2 d-flex gap-2">
                                                        <button type="button" className="btn btn-sm text-white patients-primary-btn" onClick={() => handlePaymentSubmit(charge._id)} disabled={savingPaymentChargeId === charge._id}>
                                                          {savingPaymentChargeId === charge._id ? "Salvando..." : "Salvar"}
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setPaymentChargeId(null)}>
                                                          Fechar
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}

                                                {(charge.payments || []).length > 0 && (
                                                  <div className="patient-payment-list">
                                                    <h6>Pagamentos</h6>
                                                    {charge.payments.map((payment, index) => (
                                                      <div className="patient-payment-item" key={`${charge._id}-payment-${index}`}>
                                                        <span>{new Date(payment.paidAt).toLocaleDateString("pt-BR")}</span>
                                                        <strong>{formatCents(payment.amountCents)}</strong>
                                                        <span>{payment.method}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </>
                                  ) : null}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="patients-pagination d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 mt-3 pt-3 border-top">
              <div className="text-muted small">Mostrando {patients.length} de {pagination.total} pacientes</div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => fetchPatients(pagination.page - 1, searchText)}
                >
                  Anterior
                </button>
                <span className="small fw-semibold text-muted">Página {pagination.page} / {pagination.totalPages}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => fetchPatients(pagination.page + 1, searchText)}
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
