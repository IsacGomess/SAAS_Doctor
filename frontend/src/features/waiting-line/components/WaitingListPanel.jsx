import React, { useState } from 'react';
import './WaitingListPanel.css';

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
    onCallPatient = () => {},
    onStartAttendance = () => {},
    onSelectPatient = () => {},
    isLoading = false
}) {
    // Filtra apenas pacientes aguardando ou chamados
    const visiblePatients = waitingList.filter(entry =>
        entry.status === 'aguardando' || entry.status === 'chamado'
    );

    // Estado para rastrear qual paciente está em processo
    const [loadingPatientId, setLoadingPatientId] = useState(null);

    // Manipula o clique em "Chamar Paciente"
    const handleCallClick = async (entryId, patientName) => {
        setLoadingPatientId(entryId);
        try {
            await onCallPatient(entryId);
            console.log(`Paciente ${patientName} chamado com sucesso`);
        } catch (error) {
            console.error('Erro ao chamar paciente:', error);
        } finally {
            setLoadingPatientId(null);
        }
    };

    // Manipula o clique em "Iniciar Atendimento"
    const handleStartAttendanceClick = async (entryId, patientName) => {
        setLoadingPatientId(entryId);
        try {
            await onStartAttendance(entryId);
            console.log(`Atendimento iniciado para ${patientName}`);
            onSelectPatient(entryId);
        } catch (error) {
            console.error('Erro ao iniciar atendimento:', error);
        } finally {
            setLoadingPatientId(null);
        }
    };

    // Render de estado vazio
    if (!isLoading && visiblePatients.length === 0) {
        return (
            <div className="waiting-list-panel">
                <div className="panel-header">
                    <h5 className="panel-title">Fila de Espera</h5>
                    <span className="badge bg-secondary">0</span>
                </div>
                <div className="empty-state">
                    <p className="text-muted">Nenhum paciente na fila no momento</p>
                </div>
            </div>
        );
    }

    return (
        <div className="waiting-list-panel ">
            {/* Cabeçalho com título e contador */}
            <div className="panel-header">
                <h5 className="panel-title">Fila de Espera</h5>
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
                                {entry.status === 'aguardando' && (
                                    <button
                                        className="btn btn-sm btn-outline-primary text-light"
                                        onClick={() => handleCallClick(entry._id, patientName)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Chamando...
                                            </>
                                        ) : (
                                            '📢 Chamar'
                                        )}
                                    </button>
                                )}

                                {entry.status === 'chamado' && (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleStartAttendanceClick(entry._id, patientName)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Iniciando...
                                            </>
                                        ) : (
                                            '▶ Iniciar Atendimento'
                                        )}
                                    </button>
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
