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

  // 💡 ESTADO CENTRAL DE IMPRESSÃO
  const [printData, setPrintData] = useState(null);

  // Estados dos formulários
  const [evolutionForm, setEvolutionForm] = useState({ diagnosis: '', evolutionText: '' });
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

  // 💡 FUNÇÃO CORRIGIDA QUE ATUALIZA OS DADOS E DISPARA O PRINT NATIVO
  const handleTriggerPrint = (type, item) => {
    setPrintData({ type, item });
    // Aguarda o React renderizar o HTML oculto com os dados corretos antes de chamar a janela de impressão
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // =========================================================================
  // 💡 TEMPLATE OFICIAL PADRONIZADO (SÓ APARECE NO PAPEL)
  // =========================================================================
  const renderOfficialPrintDocument = () => {
    if (!printData) return null;
    const { type, item } = printData;

    const titles = {
      evolution: 'EVOLUÇÃO CLÍNICA',
      medicalRecord: 'HISTÓRICO CLÍNICO DO PACIENTE',
      prescription: 'PRESCRIÇÃO MÉDICA'
    };

    return (
      <div className="only-print official-document-sheet">
        {/* 1. CABEÇALHO DA CLÍNICA */}
        <div className="doc-clinic-header">
          <h2>MED</h2>
          <p className="doc-subtitle">Atendimento Especializado Integrado</p>
          <div className="doc-divider"></div>
        </div>

        {/* 2. DADOS DO PACIENTE */}
        <div className="doc-patient-box">
          <div className="doc-patient-row">
            <div><strong>PACIENTE:</strong> {patient?.name?.toUpperCase()}</div>
            <div><strong>CPF:</strong> {formatCpf(patient?.cpf || '')}</div>
          </div>
          <div className="doc-patient-row mt-1">
            <div><strong>IDADE:</strong> {patient?.idade || patient?.age || 'Não informado'} anos</div>
            <div><strong>DATA DO REGISTRO:</strong> {formatDate(item.createdAt)}</div>
          </div>
        </div>

        {/* 3. TÍTULO DO DOCUMENTO ATUAL */}
        <div className="doc-title-section">
          <h3>{titles[type]}</h3>
        </div>

        {/* 4. CORPO DO DOCUMENTO */}
        <div className="doc-body-content">
          {type === 'evolution' && (
            <div>
              <p><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
              <p className="mt-3"><strong>Descrição da Evolução:</strong></p>
              <div className="doc-text-block">{item.evolutionText}</div>
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
          <div className="doc-signature-line"></div>
          <p className="m-0">Assinatura e Carimbo do Profissional</p>
          <small className="text-muted" style={{ fontSize: '9px' }}>Documento eletrônico extraído do Prontuário Médico do Paciente.</small>
        </div>
      </div>
    );
  };

  const renderEvolutionContent = () => {
    return (
      <div className="row g-4">
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
                <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Evolução'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Evoluções</h5>
              {!history.evolutions.length ? (
                <p className="text-muted text-center py-5">Nenhuma evolução registrada</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.evolutions.map((item) => {
                    const isSelected = selectedEvolutionId === item._id;
                    return (
                      <div
                        key={item._id}
                        className={`border rounded-3 p-3`}
                        style={{ backgroundColor: isSelected ? '#F0F4F3' : '#FFFFFF' }}
                      >
                        <div className="d-flex justify-content-between align-items-center cursor-pointer" onClick={() => setSelectedEvolutionId(isSelected ? null : item._id)}>
                          <span className="text-muted small">{formatDate(item.createdAt)}</span>
                          <small className="text-muted">{isSelected ? '▼' : '▶'}</small>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-top">
                            <p className="mb-2"><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                            <p className="mb-3"><strong>Evolução:</strong> {item.evolutionText || 'Não informado'}</p>
                            
                            <button onClick={() => handleTriggerPrint('evolution', item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
                              🖨️ Imprimir Documento Oficial
                            </button>
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
    return (
      <div className="row g-4">
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
                <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Histórico'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Registros Clínicos</h5>
              {!history.medicalRecords.length ? (
                <p className="text-muted text-center py-5">Nenhum registro clínico encontrado</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.medicalRecords.map((item) => {
                    const isSelected = selectedMedicalRecordId === item._id;
                    return (
                      <div
                        key={item._id}
                        className={`border rounded-3 p-3`}
                        style={{ backgroundColor: isSelected ? '#F0F4F3' : '#FFFFFF' }}
                      >
                        <div className="d-flex justify-content-between align-items-center cursor-pointer" onClick={() => setSelectedMedicalRecordId(isSelected ? null : item._id)}>
                          <span className="text-muted small">{formatDate(item.createdAt)}</span>
                          <small className="text-muted">{isSelected ? '▼' : '▶'}</small>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-top">
                            <p className="mb-3"><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                            {(item.quickHistory || []).map((entry, idx) => (
                              <div key={idx} className="mb-2 p-2 border-start border-3 border-success bg-light rounded-end small">
                                <p className="mb-1"><strong>Historico Atual da Doença:</strong> {entry.diesease} | <strong>Comorbidades:</strong> {entry.comorbidities}</p>
                              </div>
                            ))}
                            <button onClick={() => handleTriggerPrint('medicalRecord', item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 mt-2">
                              🖨️ Imprimir Documento Oficial
                            </button>
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
    return (
      <div className="row g-4">
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
                <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Prescrição'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1E6B65' }}>Histórico de Prescrições</h5>
              {!history.prescriptions.length ? (
                <p className="text-muted text-center py-5">Nenhuma prescrição registrada</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {history.prescriptions.map((item) => {
                    const isSelected = selectedPrescriptionId === item._id;
                    return (
                      <div
                        key={item._id}
                        className={`border rounded-3 p-3`}
                        style={{ backgroundColor: isSelected ? '#F0F4F3' : '#FFFFFF' }}
                      >
                        <div className="d-flex justify-content-between align-items-center cursor-pointer" onClick={() => setSelectedPrescriptionId(isSelected ? null : item._id)}>
                          <span className="text-muted small">{formatDate(item.createdAt)}</span>
                          <small className="text-muted">{isSelected ? '▼' : '▶'}</small>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-top">
                            <p className="mb-2"><strong>Diagnóstico:</strong> {item.diagnosis?.description || 'Não informado'}</p>
                            <p className="mb-2"><strong>Medicamentos:</strong> {item.medications?.map(m => m.name).join(', ') || 'Nenhum'}</p>
                            <button onClick={() => handleTriggerPrint('prescription', item)} className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 mt-2">
                              🖨️ Imprimir Documento Oficial
                            </button>
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
          /* 1. FORCE ESCONDER QUALQUER ELEMENTO FORA DO SEU ARQUIVO (SIDEBAR GLOBAL E NAV) */
          aside, nav, .sidebar, .navbar, #sidebar, .sidebar-wrapper, [class*="sidebar"], [class*="nav"] {
            display: none !important;
          }

          /* 2. OCULTA A TELA NORMAL DO SISTEMA INTERNA */
          .no-print {
            display: none !important;
          }
          
          /* 3. EXIBE EXCLUSIVAMENTE O PAPEL TIMBRADO ATÔMICO */
          body, html, #root {
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .only-print.official-document-sheet {
            display: block !important;
          }
          
          /* 4. ESTILIZAÇÃO VISUAL DO PAPEL TIMBRADO (A4) */
          .official-document-sheet {
            padding: 40px !important;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #111;
            line-height: 1.6;
          }
          .doc-clinic-header {
            text-align: center;
            margin-bottom: 25px;
          }
          .doc-clinic-header h2 {
            color: #1E6B65 !important;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
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
            padding: 12px 15px;
            border-radius: 6px;
            margin-bottom: 30px;
            font-size: 13px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .doc-patient-row {
            display: flex;
            justify-content: space-between;
          }
          .doc-title-section {
            text-align: center;
            margin-bottom: 25px;
          }
          .doc-title-section h3 {
            border-bottom: 1px solid #ddd;
            display: inline-block;
            padding-bottom: 5px;
            font-weight: bold;
            color: #333;
          }
          .doc-body-content {
            font-size: 15px;
            margin-bottom: 80px;
          }
          .doc-text-block {
            white-space: pre-wrap;
            background: #fafafa !important;
            padding: 15px;
            border-left: 3px solid #1E6B65 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
          
          /* 5. ASSINATURA ANCORADA NO FIM DA FOLHA */
          .doc-footer-signature {
            position: fixed;
            bottom: 40px;
            left: 0;
            right: 0;
            text-align: center;
            page-break-inside: avoid;
          }
          .doc-signature-line {
            width: 280px;
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
            <h2 className="fw-bold m-0" style={{ color: '#2C3E50' }}>Prontuário Médico</h2>
            <p className="text-muted m-0">Visualize a evolução, histórico clínico e prescrições do paciente.</p>
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