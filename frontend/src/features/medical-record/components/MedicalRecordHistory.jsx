import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPatientAttendanceList,
  getMedicalRecords,
  getEvolutions,
  getPrescriptions,
  createEvolution,
  createMedicalRecord,
  createPrescription,
  cancelItem,
} from '../services/medicalRecordService';
import { getSubscription } from '../../../services/billing';

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

const getProfessionalInfo = () => {
  const userName = localStorage.getItem('userName') || 'Profissional não identificado';
  const registroProf = localStorage.getItem('registroProf') || 'Não informado';

  return {
    userName: userName.trim(),
    registroProf: registroProf.trim(),
    label: `${userName.trim().toLocaleUpperCase()}${registroProf ? ` -  Reg.  ${registroProf.trim()}` : ''}`,
  };
};

const MedicalRecordHistory = () => {
  const { patientId } = useParams();
  const userRole = localStorage.getItem('role') || '';
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
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

  // 💡 ESTADO CENTRAL DE IMPRESSÃO
  const [printData, setPrintData] = useState(null);
  const evolutionFormRef = useRef(null);
  const medicalRecordFormRef = useRef(null);
  const prescriptionFormRef = useRef(null);

  // Estados dos formulários
  const [evolutionForm, setEvolutionForm] = useState({
    diagnosis: '',
    evolutionText: '',
    conduct: '',
    patientRecommendations: ''
  });
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    diagnosis: '',
    quickHistory: [{ comorbidities: '', diesease: '', observation: '' }],
  });
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    observations: '',
  });

  useEffect(() => {
    let mounted = true;

    const loadSubscriptionPlan = async () => {
      try {
        const response = await getSubscription();
        if (!mounted) return;
        setSubscriptionPlan(response?.subscription?.plan || null);
      } catch (err) {
        if (!mounted) return;
        setSubscriptionPlan(null);
      }
    };

    loadSubscriptionPlan();

    return () => {
      mounted = false;
    };
  }, []);

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

  const shouldBlockRecepcionistaSections = userRole === 'recepcionista' && subscriptionPlan !== 'professional';

  const handleCancel = async (type, itemId) => {
    if (!patientId) return;
    try {
      await cancelItem(patientId, type, itemId);
      await refreshHistory();
    } catch (err) {
      alert('Erro ao cancelar item: ' + (err?.message || 'Tente novamente'));
    }
  };

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
        conduct: evolutionForm.conduct,
        patientRecommendations: evolutionForm.patientRecommendations,
      });
      setEvolutionForm({ diagnosis: '', evolutionText: '', conduct: '', patientRecommendations: '' });
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

  // 💡 FUNÇÃO CORRIGIDA QUE ATUALIZA OS DADOS E DISPARA O PRINT NATIVO
  const handleTriggerPrint = (type, item) => {
    if (type === 'evolution') {
      setPrintData({ type: 'evolutionSection', item, section: 'evolution' });
    } else {
      setPrintData({ type, item, section: type === 'evolutionSection' ? 'recommendation' : undefined });
    }

    setTimeout(() => {
      window.print();
    }, 250);
  };

  const renderPatientHeaderBox = (patientData, professionalData, createdAt) => (
    <div className="doc-patient-box">
      <div className="doc-patient-row">
        <div><strong>PACIENTE:</strong> {patientData?.name?.toUpperCase()}</div>
        <div><strong>CPF:</strong> {formatCpf(patientData?.cpf || '')}</div>
      </div>
      <div className="doc-patient-row mt-1">
        <div><strong>IDADE:</strong> {patientData?.idade || patientData?.age || 'Não informado'} anos</div>
        <div><strong>DATA DO REGISTRO:</strong> {formatDate(createdAt)}</div>
      </div>
      <div className="doc-patient-row mt-1">
        <div><strong>PROFISSIONAL:</strong> {professionalData.userName}</div>
        <div><strong>REGISTRO:</strong> {professionalData.registroProf || 'Não informado'}</div>
      </div>
    </div>
  );

  const scrollToForm = (formRef) => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleExportRecommendation = (item) => {
    const text = item.patientRecommendations;
    if (!text || !text.trim()) {
      alert('Nenhuma recomendação disponível para exportar.');
      return;
    }

    setPrintData({ type: 'evolutionSection', item, section: 'recommendation' });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyEvolution = (item) => {
    setActiveTab('evolution');
    setEvolutionForm({
      diagnosis: item.diagnosis?.description || '',
      evolutionText: item.evolutionText || '',
      conduct: item.conduct || '',
      patientRecommendations: item.patientRecommendations || ''
    });
    setSelectedEvolutionId(null);
    scrollToForm(evolutionFormRef);
  };

  const handleCopyMedicalRecord = (item) => {
    const quickHistory = (item.quickHistory || []).map((entry) => ({
      comorbidities: entry.comorbidities || '',
      diesease: entry.diesease || '',
      observation: entry.observation || ''
    }));

    setActiveTab('medicalRecord');
    setMedicalRecordForm({
      diagnosis: item.diagnosis?.description || '',
      quickHistory: quickHistory.length > 0
        ? quickHistory
        : [{ comorbidities: '', diesease: '', observation: '' }]
    });
    setSelectedMedicalRecordId(null);
    scrollToForm(medicalRecordFormRef);
  };

  const handleCopyPrescription = (item) => {
    const medications = (item.medications || []).map((medicine) => ({
      name: medicine.name || '',
      dosage: medicine.dosage || '',
      frequency: medicine.frequency || '',
      duration: medicine.duration || ''
    }));

    setActiveTab('prescription');
    setPrescriptionForm({
      diagnosis: item.diagnosis?.description || '',
      medications: medications.length > 0
        ? medications
        : [{ name: '', dosage: '', frequency: '', duration: '' }],
      observations: item.observations || ''
    });
    setSelectedPrescriptionId(null);
    scrollToForm(prescriptionFormRef);
  };

  // =========================================================================
  // 💡 TEMPLATE OFICIAL PADRONIZADO (SÓ APARECE NO PAPEL)
  // =========================================================================
  const renderOfficialPrintDocument = () => {
    if (!printData) return null;
    const { type, item, section } = printData;
    const professional = getProfessionalInfo();

    const titles = {
      evolution: 'EVOLUÇÃO',
      evolutionSection: 'RECOMENDAÇÕES',
      medicalRecord: 'HISTÓRICO CLÍNICO',
      prescription: 'PRESCRIÇÃO'
    };

    return (
      <div className="only-print official-document-sheet">
        {/* 1. CABEÇALHO DA CLÍNICA */}
        <div className="doc-clinic-header">
          <h2>Med1PE</h2>
          <p className="doc-subtitle">Atendimento Especializado</p>
          <div className="doc-divider"></div>
        </div>

        {/* 2. DADOS DO PACIENTE */}
        {renderPatientHeaderBox(patient, professional, item.createdAt)}

        {/* 3. TÍTULO DO DOCUMENTO ATUAL */}
        <div className="doc-title-section">
          <h3>{type === 'evolutionSection' && section === 'evolution' ? 'EVOLUÇÃO' : titles[type]}</h3>
        </div>

        {/* 4. CORPO DO DOCUMENTO */}
        <div className="doc-body-content">
          {type === 'evolutionSection' && section === 'evolution' && (
            <div>
              <div className="mt-2">
                <p className="fw-bold text-uppercase">Evolução</p>
                <div className="doc-text-block">{item.evolutionText || 'Não informado'}</div>
              </div>

              {item.conduct && (
                <div className="mt-4">
                  <p className="fw-bold text-uppercase">Conduta</p>
                  <div className="doc-text-block">{item.conduct}</div>
                </div>
              )}
            </div>
          )}

          {type === 'evolutionSection' && section === 'recommendation' && (
            <div>
              <div className="mt-4">
                <p className="fw-bold text-uppercase">Recomendação</p>
                <div className="doc-text-block">{item.patientRecommendations || 'Não informado'}</div>
              </div>
            </div>
          )}

          {type === 'evolution' && (
            <div>
              <p><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
              <p className="mt-3"><strong>Descrição da Evolução:</strong></p>
              <div className="doc-text-block">{item.evolutionText || 'Não informado'}</div>

              {item.conduct && (
                <div className="mt-4">
                  <p className="fw-bold text-uppercase">Condutas</p>
                  <div className="doc-text-block">{item.conduct}</div>
                </div>
              )}

              {item.patientRecommendations && (
                <div className="mt-4">
                  <p className="fw-bold text-uppercase">Recomendações</p>
                  <div className="doc-text-block">{item.patientRecommendations}</div>
                </div>
              )}
            </div>
          )}

          {type === 'medicalRecord' && (
            <div>
              <p><strong>Diagnóstico Principal:</strong> {item.diagnosis?.description || 'Não informado'}</p>
              <h5 className="mt-4 mb-2 text-uppercase small fw-bold text-muted">Avaliações Clínicas:</h5>
              {(item.quickHistory || []).map((entry, idx) => (
                <div key={idx} className="doc-item-card">
                  <p className="m-0"><strong>Doença/Condição:</strong> {entry.diesease || '-'}</p>
                  <p className="m-0"><strong>Comorbidade associada:</strong> {entry.comorbidities || '-'}</p>
                  {entry.observation && <p className="m-0 text-muted"><small><strong>Obs:</strong> {entry.observation}</small></p>}
                </div>
              ))}
            </div>
          )}

          {type === 'prescription' && (
            <div>
              <p><strong>Diagnóstico Associado:</strong> {item.diagnosis?.description || 'Não informado'}</p>
              <h5 className="mt-4 mb-2 text-uppercase small fw-bold text-muted">Medicamentos Receitados:</h5>
              <ol className="doc-prescription-list">
                {(item.medications || []).map((m, idx) => (
                  <li key={idx} className="mb-3">
                    <span className="med-name">{m.name}</span> — <span className="med-dosage">{m.dosage}</span>
                    <div className="med-instructions">Tomar: {m.frequency} | Duração do tratamento: {m.duration}</div>
                  </li>
                ))}
              </ol>
              {item.observations && (
                <div className="doc-obs-box mt-4">
                  <strong>Observações da Receita:</strong>
                  <p className="m-0 mt-1">{item.observations}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. ASSINATURA */}
        <div className="doc-footer-signature">
          <div className="doc-signature-line"> </div>
          <p className="m-0"><strong>{professional.userName}</strong> • {professional.registroProf || 'Registro não informado'}</p>
          <p className="m-0">Assinatura do profissional</p>
          <small className="text-muted" style={{ fontSize: '9px' }}>Documento eletrônico extraído do Prontuário do Paciente.</small>
        </div>
      </div>
    );
  };

  const renderEvolutionContent = () => {
    if (shouldBlockRecepcionistaSections) {
      return (
        <div className="alert alert-danger" role="alert">Acesso negado: recepcionista não pode visualizar ou alterar evoluções.</div>
      );
    }

    return (
      <div className="row g-4">
        <div className="col-12">
          <div ref={evolutionFormRef} className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Registrar Nova Evolução</h5>
              <form onSubmit={handleSubmitEvolution}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Diagnóstico</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    style={{ minHeight: '96px', resize: 'vertical' }}
                    value={evolutionForm.diagnosis}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, diagnosis: e.target.value })}
                    placeholder="Descrição do diagnóstico"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Evolução</label>
                  <textarea
                    className="form-control"
                    rows="10"
                    style={{ minHeight: '220px', resize: 'vertical' }}
                    value={evolutionForm.evolutionText}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, evolutionText: e.target.value })}
                    placeholder="Evolução Clínica"
                    required
                  />
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-lg-6">
                    <label className="form-label text-muted small fw-bold">Conduta</label>
                    <textarea
                      className="form-control"
                      rows="6"
                      style={{ minHeight: '150px', resize: 'vertical' }}
                      value={evolutionForm.conduct}
                      onChange={(e) => setEvolutionForm({ ...evolutionForm, conduct: e.target.value })}
                      placeholder="Descreva a conduta adotada"
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <label className="form-label text-muted small fw-bold">Recomendação ao paciente</label>
                    <textarea
                      className="form-control"
                      rows="6"
                      style={{ minHeight: '150px', resize: 'vertical' }}
                      value={evolutionForm.patientRecommendations}
                      onChange={(e) => setEvolutionForm({ ...evolutionForm, patientRecommendations: e.target.value })}
                      placeholder="Orientações e cuidados para o paciente"
                    />
                  </div>
                </div>
                <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Evolução'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Evoluções</h5>
              {!history.evolutions.length ? (
                <p className="text-muted text-center py-5">Nenhuma evolução registrada</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.evolutions.map((item) => {
                    const isSelected = selectedEvolutionId === item._id;
                    const canceled = Boolean(item.canceled);
                    return (
                      <div
                        key={item._id}
                        className={`border rounded-3 p-3`}
                        style={{ backgroundColor: isSelected ? '#F0F4F3' : '#FFFFFF' }}
                      >
                        <div
                          className="d-flex justify-content-between align-items-center cursor-pointer"
                          onClick={() => setSelectedEvolutionId(isSelected ? null : item._id)}
                          title="Clique para visualizar os dados desta evolução"
                        >
                          <span className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                            {formatDate(item.createdAt)}
                            <span className="text-muted">• {item.belongsTo?.name ? `${item.belongsTo.name}${item.belongsTo.registroProf ? ` - Reg. ${item.belongsTo.registroProf}` : ''}` : getProfessionalInfo().label}</span>
                          </span>
                          <small className="text-muted">{isSelected ? '▼' : '▶'}</small>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-top">
                            {canceled && (
                              <div className="mb-2">
                                <span className="badge bg-danger text-white">CANCELADO</span>
                                {item.canceledAt && <small className="ms-2 text-muted">{formatDate(item.canceledAt)}</small>}
                                {item.canceledBy && (item.canceledBy.name || item.canceledBy.registroProf) && (
                                  <small className="ms-2 text-muted">• {item.canceledBy.name || 'Usuário'}{item.canceledBy.registroProf ? ` - ${item.canceledBy.registroProf}` : ''}</small>
                                )}
                              </div>
                            )}
                            <p className="mb-2"><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                            <p className="mb-2" style={canceled ? { textDecoration: 'line-through', color: '#6c757d' } : undefined}><strong>Evolução:</strong> {item.evolutionText || 'Não informado'}</p>
                            <p className="mb-2" style={canceled ? { textDecoration: 'line-through', color: '#6c757d' } : undefined}><strong>Conduta:</strong> {item.conduct || 'Não informado'}</p>
                            <p className="mb-3" style={canceled ? { textDecoration: 'line-through', color: '#6c757d' } : undefined}><strong>Recomendação ao paciente:</strong> {item.patientRecommendations || 'Não informado'}</p>

                            <div className="d-flex flex-wrap gap-2">
                              <button onClick={() => handleTriggerPrint('evolution', item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
                                🖨️ Imprimir
                              </button>
                              <button onClick={() => handleExportRecommendation(item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
                                📄 Recomendações ao paciente
                              </button>
                              <button onClick={() => handleCopyEvolution(item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
                                📋 Copiar
                              </button>
                              {!canceled && (
                                <button onClick={() => handleCancel('evolution', item._id)} className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1">
                                  🗑️ Apagar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMedicalRecordContent = () => {
    if (shouldBlockRecepcionistaSections) {
      return (
        <div className="alert alert-danger" role="alert">Acesso negado: recepcionista não pode visualizar ou alterar histórico clínico.</div>
      );
    }

    return (
      <div className="row g-4">
        <div className="col-12">
          <div ref={medicalRecordFormRef} className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Registrar Novo Histórico Clínico</h5>
              <form onSubmit={handleSubmitMedicalRecord}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Diagnóstico</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    style={{ minHeight: '96px', resize: 'vertical' }}
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
                <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Histórico'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Registros Clínicos</h5>
              {!history.medicalRecords.length ? (
                <p className="text-muted text-center py-5">Nenhum registro clínico encontrado</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.medicalRecords.map((item) => {
                    const isSelected = selectedMedicalRecordId === item._id;
                    const canceled = Boolean(item.canceled);
                    return (
                      <div
                        key={item._id}
                        className={`border rounded-3 p-3`}
                        style={{ backgroundColor: isSelected ? '#F0F4F3' : '#FFFFFF' }}
                      >
                        <div
                          className="d-flex justify-content-between align-items-center cursor-pointer"
                          onClick={() => setSelectedMedicalRecordId(isSelected ? null : item._id)}
                          title="Clique para visualizar os dados deste histórico clínico"
                        >
                          <span className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                            {formatDate(item.createdAt)}
                            <span className="text-muted">• {item.belongsTo?.name ? `${item.belongsTo.name}${item.belongsTo.registroProf ? ` - Reg. ${item.belongsTo.registroProf}` : ''}` : getProfessionalInfo().label}</span>
                          </span>
                          <small className="text-muted">{isSelected ? '▼' : '▶'}</small>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-top">
                            {canceled && (
                              <div className="mb-2">
                                <span className="badge bg-danger text-white">CANCELADO</span>
                                {item.canceledAt && <small className="ms-2 text-muted">{formatDate(item.canceledAt)}</small>}
                                {item.canceledBy && (item.canceledBy.name || item.canceledBy.registroProf) && (
                                  <small className="ms-2 text-muted">• {item.canceledBy.name || 'Usuário'}{item.canceledBy.registroProf ? ` - ${item.canceledBy.registroProf}` : ''}</small>
                                )}
                              </div>
                            )}
                            <p className="mb-3" style={canceled ? { textDecoration: 'line-through', color: '#6c757d' } : undefined}><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                            {(item.quickHistory || []).map((entry, idx) => (
                              <div key={idx} className="mb-2 p-2 border-start border-3 border-success bg-light rounded-end small" style={canceled ? { textDecoration: 'line-through', color: '#6c757d' } : undefined}>
                                <p className="mb-1"><strong>Historico Atual da Doença:</strong> {entry.diesease} | <strong>Comorbidades:</strong> {entry.comorbidities}</p>
                              </div>
                            ))}
                            <button onClick={() => handleTriggerPrint('medicalRecord', item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 mt-2">
                              🖨️ Imprimir
                            </button>
                            <button onClick={() => handleCopyMedicalRecord(item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 mt-2 ms-2">
                              📋 Copiar
                            </button>
                            {!canceled && (
                              <button onClick={() => handleCancel('medicalRecord', item._id)} className={`btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 mt-2 ms-2`}>
                                🗑️ Apagar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrescriptionContent = () => {
    if (shouldBlockRecepcionistaSections) {
      return (
        <div className="alert alert-danger" role="alert">Acesso negado: recepcionista não pode visualizar ou alterar prescrições.</div>
      );
    }

    return (
      <div className="row g-4">
        <div className="col-12">
          <div ref={prescriptionFormRef} className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Registrar Nova Prescrição</h5>
              <form onSubmit={handleSubmitPrescription}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Diagnóstico</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    style={{ minHeight: '96px', resize: 'vertical' }}
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
                    rows="5"
                    style={{ minHeight: '140px', resize: 'vertical' }}
                    value={prescriptionForm.observations}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, observations: e.target.value })}
                    placeholder="Observações adicionais"
                  />
                </div>
                <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Prescrição'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Prescrições</h5>
              {!history.prescriptions.length ? (
                <p className="text-muted text-center py-5">Nenhuma prescrição registrada</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.prescriptions.map((item) => {
                    const isSelected = selectedPrescriptionId === item._id;
                    const canceled = Boolean(item.canceled);
                    return (
                      <div
                        key={item._id}
                        className={`border rounded-3 p-3`}
                        style={{ backgroundColor: isSelected ? '#F0F4F3' : '#FFFFFF' }}
                      >
                        <div
                          className="d-flex justify-content-between align-items-center cursor-pointer"
                          onClick={() => setSelectedPrescriptionId(isSelected ? null : item._id)}
                          title="Clique para visualizar os dados desta prescrição"
                        >
                          <span className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                            {formatDate(item.createdAt)}
                            <span className="text-muted">• {item.belongsTo?.name ? `${item.belongsTo.name}${item.belongsTo.registroProf ? ` - Reg. ${item.belongsTo.registroProf}` : ''}` : getProfessionalInfo().label}</span>
                          </span>
                          <small className="text-muted">{isSelected ? '▼' : '▶'}</small>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-top">
                            {canceled && (
                              <div className="mb-2">
                                <span className="badge bg-danger text-white">CANCELADO</span>
                                {item.canceledAt && <small className="ms-2 text-muted">{formatDate(item.canceledAt)}</small>}
                                {item.canceledBy && (item.canceledBy.name || item.canceledBy.registroProf) && (
                                  <small className="ms-2 text-muted">• {item.canceledBy.name || 'Usuário'}{item.canceledBy.registroProf ? ` - ${item.canceledBy.registroProf}` : ''}</small>
                                )}
                              </div>
                            )}
                            <p className="mb-2" style={canceled ? { textDecoration: 'line-through', color: '#6c757d' } : undefined}><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                            <p className="mb-2" style={canceled ? { textDecoration: 'line-through', color: '#6c757d' } : undefined}><strong>Medicamentos:</strong> {item.medications?.map(m => m.name).join(', ') || 'Nenhum'}</p>
                            <button onClick={() => handleTriggerPrint('prescription', item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 mt-2">
                              🖨️ Imprimir 
                            </button>
                            <button onClick={() => handleCopyPrescription(item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 mt-2 ms-2">
                              📋 Copiar 
                            </button>
                            {!canceled && (
                              <button onClick={() => handleCancel('prescription', item._id)} className={`btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 mt-2 ms-2`}>
                                🗑️ Apagar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
      {/* 💡 REGRAS DE IMPRESSÃO GLOBAIS CIRÚRGICAS */}
      <style>{`
        .cursor-pointer { cursor: pointer; }
        .only-print { display: none !important; }
        
        @media print {
          @page {
            size: A4;
            margin: 6mm 6mm 10mm 6mm;
          }

          aside, nav, .sidebar, .navbar, #sidebar, .sidebar-wrapper, [class*="sidebar"], [class*="nav"] {
            display: none !important;
          }

          .no-print {
            display: none !important;
          }

          body, html, #root {
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .only-print.official-document-sheet {
            display: flex !important;
            flex-direction: column;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            height: auto !important;
            min-height: auto !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            zoom: 0.86 !important;
            transform-origin: top center;
            margin: 0 auto !important;
          }

          .official-document-sheet {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            height: auto !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 auto !important;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #111;
            line-height: 1.6;
            box-sizing: border-box !important;
          }

          .doc-clinic-header {
            text-align: center;
            margin: 0 0 12px 0;
          }
          .doc-clinic-header h2 {
            color: #1E6B65 !important;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
            font-size: 24px;
          }
          .doc-subtitle {
            font-size: 13px;
            color: #555;
            margin: 3px 0 0 0;
          }
          .doc-divider {
            border-bottom: 2px solid #1E6B65;
            margin-top: 15px;
          }
          .doc-patient-box {
            background-color: #f9f9f9 !important;
            border: 1px solid #eee !important;
            padding: 10px 12px;
            border-radius: 6px;
            margin-bottom: 14px;
            font-size: 12.5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .doc-patient-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            flex-wrap: wrap;
          }
          .doc-title-section {
            text-align: center;
            margin: 0 0 10px 0;
            width: 100%;
            break-inside: avoid;
            page-break-inside: avoid;
            display: block;
          }
          .doc-title-section h3 {
            border-bottom: 1px solid #ddd;
            display: block;
            width: 100%;
            padding-bottom: 4px;
            font-weight: bold;
            color: #333;
            margin: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: 1.15;
            letter-spacing: 0.02em;
            white-space: normal;
            font-size: 17px;
          }
          .doc-body-content {
            font-size: 15px;
            margin-bottom: 24px;
            flex: 1 1 auto;
          }
          .doc-text-block {
            white-space: pre-wrap;
            background: #fafafa !important;
            padding: 15px;
            border-left: 3px solid #1E6B65 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .doc-item-card {
            border-bottom: 1px solid #eee;
            padding: 10px 0;
          }
          .doc-prescription-list {
            padding-left: 20px;
          }
          .med-name { font-weight: bold; font-size: 16px; }
          .med-instructions { font-size: 13px; color: #444; margin-top: 2px; }
          .doc-obs-box {
            background: #f5f5f5 !important;
            padding: 12px;
            font-size: 13px;
            border-radius: 4px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .doc-footer-signature {
            margin-top: auto;
            padding-top: 18px;
            text-align: center;
            width: 100%;
            align-self: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .doc-signature-line {
            width: 240px;
            margin: 0 auto 8px auto;
            border-bottom: 1px dotted #000 !important;
          }
        }
      `}</style>

      {/* 💡 DOCUMENTO LIMPO EXCLUSIVO DE IMPRESSÃO */}
      {renderOfficialPrintDocument()}

      {/* RENDERIZAÇÃO DA TELA NORMAL DO SISTEMA */}
      <div className="no-print">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold m-0" style={{ color: '#2C3E50' }}>Prontuário do Paciente</h2>
            <p className="text-muted m-0">Visualize a evolução, histórico clínico e prescrições do paciente.</p>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <a
                href="https://cremesp.org.br/?siteAcao=cid10"
                target="_blank"
                rel="noreferrer"
                className="d-inline-flex align-items-center gap-2 text-decoration-none fw-semibold px-3 py-2 rounded-pill border"
                style={{
                  backgroundColor: '#EAF5F4',
                  borderColor: '#B9D9D6',
                  color: '#1E6B65',
                  boxShadow: '0 2px 8px rgba(30, 107, 101, 0.08)',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <span aria-hidden="true">🔎</span>
                Buscar CID da doença
              </a>

              <a
                href="https://cbdf.coffito.gov.br/cbdf"
                target="_blank"
                rel="noreferrer"
                className="d-inline-flex align-items-center gap-2 text-decoration-none fw-semibold px-3 py-2 rounded-pill border"
                style={{
                  backgroundColor: '#EAF5F4',
                  borderColor: '#B9D9D6',
                  color: '#1E6B65',
                  boxShadow: '0 2px 8px rgba(30, 107, 101, 0.08)',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <span aria-hidden="true">📘</span>
                C.B. DOENÇAS FISIOTERAPÊUTICAS
              </a>
            </div>
          </div>
        </div>

        {/* Informações na tela normal */}
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
                  <p className="text-muted mb-0 small text-uppercase" style={{ fontSize: '11px' }}>Paciente</p>
                  <h5 className="fw-bold mb-1" style={{ color: '#1E6B65' }}>{patient?.name?.toUpperCase() || 'Paciente'}</h5>
                  <p className="mb-0 text-dark"><strong>CPF:</strong> {formatCpf(patient?.cpf || '')}</p>
                </div>
                <div className="col-6 col-md-4 mb-3 mb-md-0">
                  <p className="mb-1 text-muted small text-uppercase" style={{ fontSize: '11px' }}>Idade</p>
                  <h6 className="m-0 fw-bold">{patient?.idade || patient?.age || 'Não informado'} anos</h6>
                </div>
                <div className="col-6 col-md-4 text-md-end">
                  <span className="badge bg-secondary py-2 px-3 text-wrap text-start">OBSERVAÇÕES: {patient?.observations || 'Nenhuma'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-3 main-data-card">
          <div className="card-body p-0">
            <ul className="nav nav-tabs nav-fill px-3 pt-3" role="tablist">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'evolution' ? 'active' : ''}`} onClick={() => setActiveTab('evolution')} type="button">Evoluções</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'medicalRecord' ? 'active' : ''}`} onClick={() => setActiveTab('medicalRecord')} type="button">Histórico Clínico</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'prescription' ? 'active' : ''}`} onClick={() => setActiveTab('prescription')} type="button">Prescrições</button>
              </li>
            </ul>

            <div className="p-4">
              {!loading && (
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
    </div>
  );
};

export default MedicalRecordHistory;