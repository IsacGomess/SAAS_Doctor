import React, { useState, useEffect } from 'react';
import './MedicalRecordPanel.css';

/**
 * Componente que exibe o painel de prontuário do paciente
 * Aparece apenas quando um paciente está em atendimento
 * Permite adicionar evolução e finalizar a consulta
 * 
 * @param {Object} patient - Dados do paciente selecionado
 * @param {Function} onFinishConsultation - Callback ao finalizar consulta
 * @param {Function} onClose - Callback ao fechar o painel
 * @param {boolean} isLoading - Indica se está processando
 * @returns {JSX.Element}
 */
export function MedicalRecordPanel({
    patient = null,
    onFinishConsultation = () => {},
    onClose = () => {},
    isLoading = false
}) {
    // Estado local
    const [evolution, setEvolution] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Limpa o estado ao mudar de paciente
    useEffect(() => {
        setEvolution('');
        setHasChanges(false);
        setShowConfirmation(false);
    }, [patient?._id]);

    // Detecta mudanças no campo de evolução
    const handleEvolutionChange = (e) => {
        const value = e.target.value;
        setEvolution(value);
        setHasChanges(value.trim().length > 0);
    };

    // Manipula o clique em "Finalizar Consulta"
    const handleFinishClick = async () => {
        if (!evolution.trim()) {
            alert('Por favor, adicione uma observação/evolução antes de finalizar.');
            return;
        }

        setIsSaving(true);
        try {
            await onFinishConsultation(patient._id, evolution);
            setEvolution('');
            setHasChanges(false);
            setShowConfirmation(false);
        } catch (error) {
            console.error('Erro ao finalizar consulta:', error);
            alert('Erro ao finalizar consulta. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    // Se não houver paciente selecionado, mostra estado vazio
    if (!patient) {
        return (
            <div className="medical-record-panel empty">
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>Selecione um paciente em atendimento para visualizar o prontuário</p>
                </div>
            </div>
        );
    }

    const patientName = patient.patientId?.name || 'Paciente desconhecido';
    const patientPhone = patient.patientId?.phone || 'N/A';
    const patientObservations = patient.patientId?.observations || '';
    const patientStatus = patient.status || '';
    const statusLabel = patientStatus === 'em_atendimento' ? 'Em Atendimento'
        : patientStatus === 'chamado' ? 'Chamado'
        : patientStatus === 'aguardando' ? 'Aguardando'
        : patientStatus || 'N/A';
    const timeValue = patient.attendedAt || patient.calledAt || patient.checkInAt || null;
    const timeLabel = timeValue ? new Date(timeValue).toLocaleTimeString('pt-BR') : 'N/A';

    return (
        <div className="medical-record-panel">
            {/* Cabeçalho do prontuário */}
            <div className="record-header">
                <div className="header-content">
                    <h5 className="record-title">Prontuário do Paciente</h5>
                    <div className="patient-status">
                        <span className={`status-badge ${patientStatus === 'em_atendimento' ? 'bg-success' : patientStatus === 'chamado' ? 'bg-warning' : 'bg-secondary'}`}>
                            {statusLabel}
                        </span>
                        <span className="patient-info-small">
                            {patient.attendedAt ? 'Hora atendimento:' : patient.calledAt ? 'Hora chamado:' : 'Entrada:'} {timeLabel}
                        </span>
                    </div>
                </div>
                <button
                    className="btn-close"
                    onClick={onClose}
                    aria-label="Fechar"
                    title="Fechar prontuário"
                ></button>
            </div>

            {/* Divisor */}
            <div className="record-divider"></div>

            {/* Conteúdo do prontuário */}
            <div className="record-content">
                {/* Informações do paciente */}
                <div className="patient-details">
                    <div className="detail-group">
                        <label className="detail-label">Nome do Paciente</label>
                        <p className="detail-value">{patientName}</p>
                    </div>

                    <div className="detail-group">
                        <label className="detail-label">Telefone</label>
                        <p className="detail-value">{patientPhone}</p>
                    </div>

                    {patientObservations && (
                        <div className="detail-group">
                            <label className="detail-label">Observações Gerais</label>
                            <div className="detail-observations">
                                <p className="detail-value">{patientObservations}</p>
                            </div>
                        </div>
                    )}

                    {/* Informações da fila */}
                    <div className="queue-info">
                        <div className="info-item">
                            <span className="info-label">Fila:</span>
                            <span className="info-value">#{patient.lineNumber}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Prioridade:</span>
                            <span className={`info-value priority-${patient.priority}`}>
                                {patient.priority === 'normal' && 'Normal'}
                                {patient.priority === 'prioritario' && 'Prioritário'}
                                {patient.priority === 'emergencia' && 'Emergência'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Área:</span>
                            <span className="info-value">{patient.clinicArea || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Divisor interno */}
                <div className="section-divider"></div>

                {/* Campo de evolução/observações */}
                <div className="evolution-section">
                    <label htmlFor="evolution" className="evolution-label">
                        Evolução / Observações da Consulta
                        <span className="required">*</span>
                    </label>
                    <div className="evolution-textarea-wrapper">
                        <textarea
                            id="evolution"
                            className="evolution-textarea"
                            placeholder="Digite aqui a evolução clínica, achados, diagnóstico, conduta e outros detalhes relevantes da consulta..."
                            value={evolution}
                            onChange={handleEvolutionChange}
                            disabled={isLoading || isSaving}
                            rows={8}
                        />
                        <div className="textarea-footer">
                            <span className="char-count">
                                {evolution.length} caracteres
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rodapé com botões */}
            <div className="record-footer">
                <button
                    className="btn btn-sm btn-secondary"
                    onClick={onClose}
                    disabled={isSaving}
                >
                    Continuar em Atendimento
                </button>
                <button
                    className={`btn btn-sm ${hasChanges ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setShowConfirmation(true)}
                    disabled={!hasChanges || isSaving || isLoading}
                    title={!hasChanges ? 'Adicione uma observação para finalizar' : ''}
                >
                    {isSaving ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Finalizando...
                        </>
                    ) : (
                        '✓ Finalizar Consulta'
                    )}
                </button>
            </div>

            {/* Modal de confirmação */}
            {showConfirmation && (
                <div className="confirmation-modal-overlay" onClick={() => !isSaving && setShowConfirmation(false)}>
                    <div className="confirmation-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h6 className="modal-title">Confirmar Finalização</h6>
                            <button
                                className="btn-close"
                                onClick={() => setShowConfirmation(false)}
                                disabled={isSaving}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <p>Tem certeza de que deseja finalizar a consulta de <strong>{patientName}</strong>?</p>
                            <p className="text-muted small">Esta ação não poderá ser desfeita.</p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setShowConfirmation(false)}
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={handleFinishClick}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Finalizando...
                                    </>
                                ) : (
                                    'Confirmar Finalização'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
