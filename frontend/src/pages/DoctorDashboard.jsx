import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWaitingLine } from '../hooks/useWaitingLine';
import { WaitingListPanel } from '../pages-components/WaitingListPanel';
import { MedicalRecordPanel } from '../pages-components/MedicalRecordPanel';
import './DoctorDashboard.css';

function DoctorDashboard() {
  const auth = useAuth();
  const waitingLine = useWaitingLine({
    clinicArea: auth.clinicArea,
    pollInterval: 15000,
  });

  const [clinicAreaInput, setClinicAreaInput] = useState('');
  const [showClinicAreaModal, setShowClinicAreaModal] = useState(false);

  // Mostrar modal se não tem área selecionada
  useEffect(() => {
    if (!auth.isLoading && !auth.clinicArea && !showClinicAreaModal) {
      setShowClinicAreaModal(true);
    }
  }, [auth.clinicArea, auth.isLoading, showClinicAreaModal]);

  // Refazer busca quando área da clínica muda
  useEffect(() => {
    if (auth.clinicArea) {
      waitingLine.fetchWaitingLine();
    }
  }, [auth.clinicArea]);

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
                <span className="status-text">Polling pausado</span>
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
export default DoctorDashboard;