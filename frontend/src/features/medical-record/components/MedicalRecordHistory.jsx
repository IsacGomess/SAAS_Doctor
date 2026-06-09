import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPatientAttendanceList,
  getMedicalRecords,
  getEvolutions,
  getPrescriptions,
  createEvolution,
  createMedicalRecord,
  createPrescription,
} from '../services/medicalRecordService';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCpf = (cpf = '') => {
  const digits = cpf.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const renderEmptyState = (message) => (
  <div className="card border-0 shadow-sm rounded-3 p-4 text-center">
    <div className="fs-3 mb-2 text-muted">Nenhum registro encontrado</div>
    <p className="mb-0 text-muted">{message}</p>
  </div>
);

const MedicalRecordHistory = () => {
  const { patientId } = useParams();
  const [activeTab, setActiveTab] = useState('evolution');
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState({
    evolutions: [],
    medicalRecords: [],
    prescriptions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvolutionId, setSelectedEvolutionId] = useState(null);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states - Evolução
  const [evolutionForm, setEvolutionForm] = useState({
    diagnosis: '',
    evolutionText: '',
  });

  // Form states - Medical Record
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    diagnosis: '',
    quickHistory: [{ comorbidities: '', diesease: '', observation: '' }],
  });

  // Form states - Prescrição
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    observations: '',
  });

  useEffect(() => {
    const loadHistory = async () => {
      if (!patientId) return;
      setLoading(true);
      setError('');

      try {
        const [patients, evolutions, medicalRecords, prescriptions] = await Promise.all([
          getPatientAttendanceList(),
          getEvolutions(patientId),
          getMedicalRecords(patientId),
          getPrescriptions(patientId),
        ]);

        const currentPatient = patients.find((item) => item._id === patientId);
        setPatient(currentPatient || { name: 'Paciente não encontrado', cpf: '', age: 'Não informado' });
        setHistory({ evolutions, medicalRecords, prescriptions });
      } catch (err) {
        setError(err?.message || 'Erro ao carregar o histórico do paciente.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [patientId]);

  const refreshHistory = async () => {
    try {
      const [evolutions, medicalRecords, prescriptions] = await Promise.all([
        getEvolutions(patientId),
        getMedicalRecords(patientId),
        getPrescriptions(patientId),
      ]);
      setHistory({ evolutions, medicalRecords, prescriptions });
    } catch (err) {
      console.error('Erro ao atualizar histórico:', err);
    }
  };

  const handleSubmitEvolution = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createEvolution({
        patientId,
        diagnosis: { description: evolutionForm.diagnosis },
        evolutionText: evolutionForm.evolutionText,
      });
      setEvolutionForm({ diagnosis: '', evolutionText: '' });
      setSelectedEvolutionId(null);
      await refreshHistory();
    } catch (err) {
      alert('Erro ao criar evolução: ' + (err?.message || 'Tente novamente'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitMedicalRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createMedicalRecord({
        patientId,
        diagnosis: { description: medicalRecordForm.diagnosis },
        quickHistory: medicalRecordForm.quickHistory.filter(item => item.diesease),
      });
      setMedicalRecordForm({ diagnosis: '', quickHistory: [{ comorbidities: '', diesease: '', observation: '' }] });
      setSelectedMedicalRecordId(null);
      await refreshHistory();
    } catch (err) {
      alert('Erro ao criar histórico clínico: ' + (err?.message || 'Tente novamente'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPrescription({
        patientId,
        diagnosis: { description: prescriptionForm.diagnosis },
        medications: prescriptionForm.medications.filter(item => item.name),
        observations: prescriptionForm.observations,
      });
      setPrescriptionForm({ diagnosis: '', medications: [{ name: '', dosage: '', frequency: '', duration: '' }], observations: '' });
      setSelectedPrescriptionId(null);
      await refreshHistory();
    } catch (err) {
      alert('Erro ao criar prescrição: ' + (err?.message || 'Tente novamente'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderEvolutionContent = () => {
    return (
      <div className="row g-4">
        {/* Coluna Esquerda - Formulário */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Registrar Nova Evolução</h5>
              <form onSubmit={handleSubmitEvolution}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Diagnóstico</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={evolutionForm.diagnosis}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, diagnosis: e.target.value })}
                    placeholder="Descrição do diagnóstico"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold">Evolução</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={evolutionForm.evolutionText}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, evolutionText: e.target.value })}
                    placeholder="Evolução Clínica"
                    required
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                    {submitting ? 'Salvando...' : 'Salvar Evolução'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Histórico Compacto */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Evoluções</h5>
              {!history.evolutions.length ? (
                <p className="text-muted text-center py-5">Nenhuma evolução registrada</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.evolutions.map((item) => (
                    <button
                      key={item._id}
                      className={`btn text-start border rounded-3 p-3 ${selectedEvolutionId === item._id ? 'border-success' : 'border-light'}`}
                      style={{
                        backgroundColor: selectedEvolutionId === item._id ? '#F0F4F3' : '#FFFFFF',
                      }}
                      onClick={() => setSelectedEvolutionId(selectedEvolutionId === item._id ? null : item._id)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">{formatDate(item.createdAt)}</span>
                        <small className="text-muted">
                          {selectedEvolutionId === item._id ? '▼' : '▶'}
                        </small>
                      </div>
                      {selectedEvolutionId === item._id && (
                        <div className="mt-3 pt-3 border-top">
                          <p className="mb-2"><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                          <p className="mb-0"><strong>Evolução:</strong> {item.evolutionText || 'Não informado'}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMedicalRecordContent = () => {
    return (
      <div className="row g-4">
        {/* Coluna Esquerda - Formulário */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Registrar Novo Histórico Clínico</h5>
              <form onSubmit={handleSubmitMedicalRecord}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Diagnóstico</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={medicalRecordForm.diagnosis}
                    onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, diagnosis: e.target.value })}
                    placeholder="Descrição do diagnóstico"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold">Avaliação</label>
                  {medicalRecordForm.quickHistory.map((entry, idx) => (
                    <div key={idx} className="mb-3 p-3 border rounded-3" style={{ backgroundColor: '#F8F9FA' }}>
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Comorbidade"
                        value={entry.comorbidities}
                        onChange={(e) => {
                          const updated = [...medicalRecordForm.quickHistory];
                          updated[idx].comorbidities = e.target.value;
                          setMedicalRecordForm({ ...medicalRecordForm, quickHistory: updated });
                        }}
                      />
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Doença"
                        value={entry.diesease}
                        onChange={(e) => {
                          const updated = [...medicalRecordForm.quickHistory];
                          updated[idx].diesease = e.target.value;
                          setMedicalRecordForm({ ...medicalRecordForm, quickHistory: updated });
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Observação"
                        value={entry.observation}
                        onChange={(e) => {
                          const updated = [...medicalRecordForm.quickHistory];
                          updated[idx].observation = e.target.value;
                          setMedicalRecordForm({ ...medicalRecordForm, quickHistory: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                    {submitting ? 'Salvando...' : 'Salvar Histórico'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Histórico Compacto */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Registros Clínicos</h5>
              {!history.medicalRecords.length ? (
                <p className="text-muted text-center py-5">Nenhum registro clínico encontrado</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.medicalRecords.map((item) => (
                    <button
                      key={item._id}
                      className={`btn text-start border rounded-3 p-3 ${selectedMedicalRecordId === item._id ? 'border-success' : 'border-light'}`}
                      style={{
                        backgroundColor: selectedMedicalRecordId === item._id ? '#F0F4F3' : '#FFFFFF',
                      }}
                      onClick={() => setSelectedMedicalRecordId(selectedMedicalRecordId === item._id ? null : item._id)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">{formatDate(item.createdAt)}</span>
                        <small className="text-muted">
                          {selectedMedicalRecordId === item._id ? '▼' : '▶'}
                        </small>
                      </div>
                      {selectedMedicalRecordId === item._id && (
                        <div className="mt-3 pt-3 border-top">
                          <p className="mb-2"><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                          {(item.quickHistory || []).map((entry, idx) => (
                            <div key={idx} className="mb-2 small">
                              <p className="mb-1 text-muted">
                                <strong>Doença:</strong> {entry.diesease} | <strong>Comorbidade:</strong> {entry.comorbidities}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrescriptionContent = () => {
    return (
      <div className="row g-4">
        {/* Coluna Esquerda - Formulário */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Registrar Nova Prescrição</h5>
              <form onSubmit={handleSubmitPrescription}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Diagnóstico</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={prescriptionForm.diagnosis}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                    placeholder="Descrição do diagnóstico"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Medicamentos</label>
                  {prescriptionForm.medications.map((medicine, idx) => (
                    <div key={idx} className="mb-3 p-3 border rounded-3" style={{ backgroundColor: '#F8F9FA' }}>
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Nome do medicamento"
                        value={medicine.name}
                        onChange={(e) => {
                          const updated = [...prescriptionForm.medications];
                          updated[idx].name = e.target.value;
                          setPrescriptionForm({ ...prescriptionForm, medications: updated });
                        }}
                      />
                      <div className="row g-2">
                        <div className="col-6">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Dosagem"
                            value={medicine.dosage}
                            onChange={(e) => {
                              const updated = [...prescriptionForm.medications];
                              updated[idx].dosage = e.target.value;
                              setPrescriptionForm({ ...prescriptionForm, medications: updated });
                            }}
                          />
                        </div>
                        <div className="col-6">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Frequência"
                            value={medicine.frequency}
                            onChange={(e) => {
                              const updated = [...prescriptionForm.medications];
                              updated[idx].frequency = e.target.value;
                              setPrescriptionForm({ ...prescriptionForm, medications: updated });
                            }}
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        className="form-control mt-2"
                        placeholder="Duração"
                        value={medicine.duration}
                        onChange={(e) => {
                          const updated = [...prescriptionForm.medications];
                          updated[idx].duration = e.target.value;
                          setPrescriptionForm({ ...prescriptionForm, medications: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Observações</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={prescriptionForm.observations}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, observations: e.target.value })}
                    placeholder="Observações adicionais"
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                    {submitting ? 'Salvando...' : 'Salvar Prescrição'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Histórico Compacto */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Prescrições</h5>
              {!history.prescriptions.length ? (
                <p className="text-muted text-center py-5">Nenhuma prescrição registrada</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.prescriptions.map((item) => (
                    <button
                      key={item._id}
                      className={`btn text-start border rounded-3 p-3 ${selectedPrescriptionId === item._id ? 'border-success' : 'border-light'}`}
                      style={{
                        backgroundColor: selectedPrescriptionId === item._id ? '#F0F4F3' : '#FFFFFF',
                      }}
                      onClick={() => setSelectedPrescriptionId(selectedPrescriptionId === item._id ? null : item._id)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">{formatDate(item.createdAt)}</span>
                        <small className="text-muted">
                          {selectedPrescriptionId === item._id ? '▼' : '▶'}
                        </small>
                      </div>
                      {selectedPrescriptionId === item._id && (
                        <div className="mt-3 pt-3 border-top">
                          <p className="mb-2"><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                          <p className="mb-2"><strong>Medicamentos:</strong> {item.medications?.map(m => m.name).join(', ') || 'Nenhum'}</p>
                          <p className="mb-2"><strong>Dosagem:</strong> {item.medications?.map(m => m.dosage).join(', ') || 'Nenhum'}</p>
                          <p className="mb-2"><strong>Frequência:</strong> {item.medications?.map(m => m.frequency).join(', ') || 'Nenhum'}</p>
                          <p className="mb-2"><strong>Duração:</strong> {item.medications?.map(m => m.duration).join(', ') || 'Nenhum'}</p>
                          <p className="mb-0"><strong>Observações:</strong> {item.observations || 'Nenhuma'}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid pt-5 ps-1 pe-0 w-100" style={{ minHeight: '100%' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0" style={{ color: '#2C3E50' }}>Prontuário</h2>
          <p className="text-muted m-0">Visualize a evolução, histórico clínico e prescrições do paciente.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <span className="ms-2">Carregando histórico...</span>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">{error}</div>
          ) : (
            <div className="row align-items-center">
              <div className="col-12 col-md-4 mb-3 mb-md-0">
                <h5 className="fw-bold mb-1">{patient?.name?.toUpperCase() || 'Paciente'}</h5>
                <p className="text-muted mb-0">CPF: {formatCpf(patient?.cpf || '')}</p>
              </div>
              <div className="col-12 col-md-4 mb-3 mb-md-0">
                <p className="mb-1 text-muted">Idade</p>
                <h6 className="m-0">{patient?.idade || 'Não informado'}</h6>
              </div>
              <div className="col-12 col-md-4 text-md-end">
                <span className="badge bg-secondary py-2 px-3">observações: {patient?.observations}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-fill px-3 pt-3" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'evolution' ? 'active' : ''}`}
                onClick={() => setActiveTab('evolution')}
                type="button"
              >
                Evoluções
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'medicalRecord' ? 'active' : ''}`}
                onClick={() => setActiveTab('medicalRecord')}
                type="button"
              >
                Histórico Clínico
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'prescription' ? 'active' : ''}`}
                onClick={() => setActiveTab('prescription')}
                type="button"
              >
                Prescrições
              </button>
            </li>
          </ul>

          <div className="p-4">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <span className="ms-2">Carregando conteúdo...</span>
              </div>
            ) : (
              <div>
                {activeTab === 'evolution' && renderEvolutionContent()}
                {activeTab === 'medicalRecord' && renderMedicalRecordContent()}
                {activeTab === 'prescription' && renderPrescriptionContent()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordHistory;
