import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useWaitingLine } from '../../../hooks/useWaitingLine';
import { WaitingListPanel } from '../components/WaitingListPanel';
import { MedicalRecordPanel } from '../../medical-record/components/MedicalRecordPanel';
import './Waiting-line.css';

function WaitingLine() {
  const navigate = useNavigate();
  const auth = useAuth(); // arquivos de autenticaçao global criados em jwt
  const waitingLine = useWaitingLine({
    clinicArea: auth.clinicArea,
    pollInterval: null,
    assignedUserId: auth.userId
  });

  const [clinicAreaInput, setClinicAreaInput] = useState('');
  const [showClinicAreaModal, setShowClinicAreaModal] = useState(false);

  // Mostrar modal se não tem área selecionada
  useEffect(() => {
    if (!auth.isLoading && !auth.clinicArea && !showClinicAreaModal) {
      setShowClinicAreaModal(true);
    }
  }, [auth.clinicArea, auth.isLoading, showClinicAreaModal]);


  const handleSetClinicArea = () => {
    if (clinicAreaInput.trim()) {
      auth.setDoctorClinicArea(clinicAreaInput.trim());
      setClinicAreaInput('');
      setShowClinicAreaModal(false);
    }
  };

  if (auth.isLoading) {
    return (
      <div className="doctor-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      {/* CABEÇALHO */}
      <div className="dashboard-header">
        <div className="header-top">
          <h1>Gerenciamento de Fila de Espera</h1>
          <p className="greeting">Bem-vindo, Dr. {auth.userName}</p>
        </div>

        <div className="header-controls">
          <button
            type="button"
            className="btn btn-outline-secondary me-3"
            onClick={() => {
              auth.refreshUserInfo();
              navigate('/dashboard/patients');
            }}
          >
            ← Voltar para Pacientes
          </button>
          <button type='button' className='btn btn-primary me-3 bg-green'
                  onClick={waitingLine.fetchWaitingLine}
                  disabled={waitingLine.isLoading} >
                    Atualizar Fila
          </button>

          {/* Seletor de Área da Clínica */}
          <div className="clinic-area-selector">
            <label>Área da Clínica:</label>
            <div className="clinic-area-display">
              <span className="clinic-area-badge">{auth.clinicArea || 'Não selecionada'}</span>
              <button
                className="btn-alter-area"
                onClick={() => setShowClinicAreaModal(true)}
              >
                Alterar
              </button>
            </div>
          </div>

          {/* Status de Polling */}
          <div className="polling-status">
            {waitingLine.isPolling ? (
              <>
                <span className="status-dot active"></span>
                <span className="status-text">Atualização em tempo real</span>
              </>
            ) : (
              <>
                <span className="status-dot inactive"></span>
                <span className="status-text">Atualização manual</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="dashboard-content">
        {/* Coluna Esquerda: Lista de Espera */}
        <div className="left-column">
          <WaitingListPanel
            waitingList={waitingLine.waitingList}
            selectedPatient={waitingLine.selectedPatient}
            onCallPatient={waitingLine.handleCallPatient}
            onStartAttendance={waitingLine.handleStartAttendance}
            onSelectPatient={waitingLine.handleSelectPatient}
            isLoading={waitingLine.isLoading}
          />
        </div>

        {/* Coluna Direita: Prontuário */}
        <div className="right-column">
          <MedicalRecordPanel
            patient={waitingLine.selectedPatient}
            onFinishConsultation={waitingLine.handleFinishConsultation}
            onClose={waitingLine.clearSelection}
            isLoading={waitingLine.isLoading}
          />
        </div>
      </div>

      {/* MODAL DE SELEÇÃO DE ÁREA */}
      {showClinicAreaModal && (
        <div className="clinic-area-modal-overlay">
          <div className="clinic-area-modal">
            <h2>Selecione a Área da Clínica</h2>
            <p>Você precisa selecionar uma área para gerenciar a fila de espera.</p>

            <input
              type="text"
              placeholder="Ex: Clínica Geral, Pediatria, Dermatologia..."
              value={clinicAreaInput}
              onChange={(e) => setClinicAreaInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSetClinicArea()}
              className="clinic-area-input"
              autoFocus
            />

            <div className="modal-buttons">
              <button
                className="btn-confirm"
                onClick={handleSetClinicArea}
                disabled={!clinicAreaInput.trim()}
              >
                Confirmar
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowClinicAreaModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default WaitingLine;