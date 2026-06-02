import React, { useState } from 'react';
import './WaitingListPanel.css';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import patientService from '../../patients/patientService';

/**
 * Componente que exibe a lista de pacientes aguardando na fila de espera
 * Filtra apenas pacientes com status 'aguardando' ou 'chamado'
 * 
 * @param {Array} waitingList - Lista completa da fila de espera
 * @param {Object} selectedPatient - Paciente selecionado atualmente
 * @param {Function} onCallPatient - Callback ao chamar paciente
 * @param {Function} onStartAttendance - Callback ao iniciar atendimento
 * @param {Function} onSelectPatient - Callback ao selecionar um paciente
 * @param {boolean} isLoading - Indica se está carregando dados
 * @returns {JSX.Element}
 */
export function WaitingListPanel({
    waitingList = [],
    selectedPatient = null,
    statusFilter = null,
    onCallPatient = () => {},
    onStartAttendance = () => {},
    onSelectPatient = () => {},
    onFinishConsultation = () => {},
    onRemoveEntry = () => {},
    fetchWaitingLine = () => {},
    isLoading = false
}) {
    // Filtra pela lista de status passada; se não houver, mantém antigo comportamento
    const visiblePatients = waitingList.filter(entry => {
        if (Array.isArray(statusFilter) && statusFilter.length > 0) return statusFilter.includes(entry.status);
        return entry.status === 'aguardando' || entry.status === 'chamado';
    });

    // Estado para rastrear qual paciente está em processo
    const [loadingPatientId, setLoadingPatientId] = useState(null);
    const [showMedicalModalFor, setShowMedicalModalFor] = useState(null);
    const [showEvolutionModalFor, setShowEvolutionModalFor] = useState(null);
    const [medicalForm, setMedicalForm] = useState({ title: '', diagnosis: '', plan: '' });
    const [evolutionText, setEvolutionText] = useState('');
    const auth = useAuth();
    const navigate = useNavigate();

    // Manipula o clique em "Chamar Paciente"
    const handleCallClick = async (entryId, patientName) => {
        setLoadingPatientId(entryId);
        try {
            await onCallPatient(entryId);
            if (fetchWaitingLine) await fetchWaitingLine();
            console.log(`Paciente ${patientName} chamado com sucesso`);
        } catch (error) {
            console.error('Erro ao chamar paciente:', error);
        } finally {
            setLoadingPatientId(null);
        }
    };

    // Manipula o clique em "Finalizar Consulta" para entradas chamadas/em atendimento
    const handleFinishClick = async (entryId, obs = '') => {
        setLoadingPatientId(entryId);
        try {
            await onFinishConsultation(entryId, obs);
            if (fetchWaitingLine) await fetchWaitingLine();
            console.log(`Consulta finalizada para ${entryId}`);
        } catch (error) {
            console.error('Erro ao finalizar consulta:', error);
        } finally {
            setLoadingPatientId(null);
        }
    };

    // Abertura dos modais
    const openMedicalModal = (entryId) => {
        setMedicalForm({ title: '', diagnosis: '', plan: '' });
        setShowMedicalModalFor(entryId);
    };

    const openEvolutionModal = (entryId) => {
        setEvolutionText('');
        setShowEvolutionModalFor(entryId);
    };

    const submitMedicalRecord = async (entryId) => {
        try {
            const patientEntry = waitingList.find(e => e._id === entryId);
            const patientId = patientEntry?.patientId?._id || patientEntry?.patientId;
            await patientService.createMedicalRecord({
                patientId,
                title: medicalForm.title,
                diagnosis: medicalForm.diagnosis,
                plan: medicalForm.plan
            });
            alert('Prontuário salvo com sucesso');
            setShowMedicalModalFor(null);
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar prontuário');
        }
    };

    const submitEvolution = async (entryId) => {
        try {
            const patientEntry = waitingList.find(e => e._id === entryId);
            const patientId = patientEntry?.patientId?._id || patientEntry?.patientId;
            await patientService.createEvolution({
                patientId,
                notes: evolutionText
            });
            alert('Evolução registrada com sucesso');
            setShowEvolutionModalFor(null);
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar evolução');
        }
    };

    // Render de estado vazio
    if (!isLoading && visiblePatients.length === 0) {
        return (
            <>
                <div className="waiting-list-panel">
                    <div className="panel-header">
                        <h5 className="panel-title">Fila de Espera</h5>
                        <span className="badge bg-secondary">0</span>
                    </div>
                    <div className="empty-state">
                        <p className="text-muted">Nenhum paciente na fila no momento</p>
                    </div>
                </div>

                {/* Modal simples para Criar Prontuário */}
                {showMedicalModalFor && (
                    <div className="modal-overlay" onClick={() => setShowMedicalModalFor(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h5>Nova Avaliação</h5>
                            <input placeholder="Título" value={medicalForm.title} onChange={(e)=>setMedicalForm({...medicalForm, title: e.target.value})} />
                            <textarea placeholder="Diagnóstico" value={medicalForm.diagnosis} onChange={(e)=>setMedicalForm({...medicalForm, diagnosis: e.target.value})} />
                            <textarea placeholder="Plano" value={medicalForm.plan} onChange={(e)=>setMedicalForm({...medicalForm, plan: e.target.value})} />
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={()=>setShowMedicalModalFor(null)}>Cancelar</button>
                                <button className="btn btn-success" onClick={()=>submitMedicalRecord(showMedicalModalFor)}>Salvar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal simples para Evolução */}
                {showEvolutionModalFor && (
                    <div className="modal-overlay" onClick={() => setShowEvolutionModalFor(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h5>Nova Evolução</h5>
                            <textarea placeholder="Evolução clínica" value={evolutionText} onChange={(e)=>setEvolutionText(e.target.value)} />
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={()=>setShowEvolutionModalFor(null)}>Cancelar</button>
                                <button className="btn btn-success" onClick={()=>submitEvolution(showEvolutionModalFor)}>Salvar</button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="waiting-list-panel ">
            {/* Cabeçalho com título e contador */}
            <div className="panel-header">
                <h4 className="panel-title">Fila de Espera</h4>
                <span className="badge bg-info">{visiblePatients.length}</span>
            </div>

            {/* Spinner de carregamento */}
            {isLoading && (
                <div className="loading-spinner">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                    <span className="ms-2 text-muted small">Atualizando fila...</span>
                </div>
            )}

            {/* Lista de pacientes */}
            <div className="patient-list">
                {visiblePatients.map((entry, index) => {
                    const isSelected = selectedPatient?._id === entry._id;
                    const isLoading = loadingPatientId === entry._id;
                    const patientName = entry.patientId?.name || 'Paciente desconhecido';
                    const priorityBadgeClass = {
                        normal: 'bg-success-subtle text-success',
                        prioritario: 'bg-warning-subtle text-warning',
                        emergencia: 'bg-danger-subtle text-danger'
                    }[entry.priority] || 'bg-secondary-subtle';
                            
                    return (
                        <div
                            key={entry._id}
                            className={`patient-card ${isSelected ? 'selected' : ''}`}
                        >
                            {/* Número da fila */}
                            <div className="queue-number">
                                <span className="badge bg-success rounded-pill fs-6">
                                    #{entry.lineNumber}
                                </span>
                            </div>

                            {/* Informações do paciente */}
                            <div className="patient-info">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h6 className="patient-name mb-1">{patientName}</h6>
                                        <small className="text-muted">
                                            {entry.clinicArea && `Área: ${entry.clinicArea}`}
                                        </small>
                                    </div>
                                    <span className={`badge ${priorityBadgeClass} rounded-pill px-2 py-1`}>
                                        {entry.priority === 'normal' && 'Normal'}
                                        {entry.priority === 'prioritario' && 'Prioritário'}
                                        {entry.priority === 'emergencia' && 'Emergência'}
                                    </span>
                                </div>

                                {/* Status atual */}
                                <div className="status-info mb-2">
                                    <small className="text-light">
                                        Status: <strong>{
                                            entry.status === 'aguardando' && 'Aguardando'
                                        }
                                        {entry.status === 'chamado' && 'Chamado'}</strong>
                                    </small>
                                </div>

                                {/* Tempo de espera */}
                                {entry.checkInAt && (
                                    <div className="waiting-time mb-3">
                                        <small className="text-muted">
                                            Entrada: {new Date(entry.checkInAt).toLocaleTimeString('pt-BR')}
                                        </small>
                                    </div>
                                )}
                            </div>

                            {/* Botões de ação */}
                            <div className="patient-actions">
                                {/* Compact behavior: left column shows only Chamar; right shows Finalizar + Cancelar */}
                                {Array.isArray(statusFilter) && statusFilter.includes('aguardando') && (
                                    <button
                                        className="btn btn-sm btn-compact btn-outline-primary"
                                        onClick={() => handleCallClick(entry._id, patientName)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Chamando...' : '📢 Chamar'}
                                    </button>
                                )}

                                {Array.isArray(statusFilter) && (statusFilter.includes('chamado') || statusFilter.includes('em_atendimento')) && (
                                    <>
                                        <button
                                            className="btn btn-sm btn-compact btn-primary me-2"
                                            onClick={() => handleFinishClick(entry._id, '')}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Finalizando...' : '✅ Finalizar Consulta'}
                                        </button>

                                        <button
                                            className="btn btn-sm btn-compact btn-outline-danger"
                                            onClick={async () => { setLoadingPatientId(entry._id); try { await onRemoveEntry(entry._id, 'cancelado_pelo_usuario'); if (fetchWaitingLine) await fetchWaitingLine(); } catch(e){console.error(e);} finally { setLoadingPatientId(null); } }}
                                            disabled={isLoading}
                                        >
                                            ❌ Cancelar
                                        </button>
                                    </>
                                )}

                                {/* Fallback: mantém botões completos em caso de uso sem statusFilter */}
                                {!statusFilter && (
                                    <>
                                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openMedicalModal(entry._id)}>
                                            Avaliação
                                        </button>

                                        <button className="btn btn-sm btn-outline-info me-2" onClick={() => openEvolutionModal(entry._id)}>
                                            Evolução
                                        </button>

                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => onRemoveEntry(entry._id, 'cancelado_pelo_usuario') }
                                            disabled={isLoading}
                                        >
                                            🗑️ Remover
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Rodapé com estatísticas */}
            <div className="panel-footer">
                <small className="text-muted">
                    Click em chamar para atender paciente 
                </small>
            </div>
        </div>
    );
}
