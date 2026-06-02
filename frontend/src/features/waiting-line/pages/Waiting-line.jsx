import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useWaitingLine } from '../services/useWaitingLine';
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
          <h3>Gerenciamento de Fila de Espera</h3>
          <p className="greeting">Bem-vindo, Dr. {auth.userName.toUpperCase()}</p>
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
                className="btn-alter-area rounded"
                onClick={() => setShowClinicAreaModal(true)}
              >
                Alterar
              </button>
            </div>
          </div>
      
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="dashboard-content two-columns">
        {/* Coluna Esquerda: Aguardando */}
        <div className="left-column compact-column">
          <h4 className="column-title">Aguardando</h4>
          <WaitingListPanel
            waitingList={waitingLine.waitingList}
            statusFilter={['aguardando']}
            onCallPatient={async (id) => { await waitingLine.handleCallPatient(id); await waitingLine.fetchWaitingLine(); }}
            fetchWaitingLine={waitingLine.fetchWaitingLine}
            isLoading={waitingLine.isLoading}
          />
        </div>

        {/* Coluna Direita: Chamados / Em Atendimento */}
        <div className="right-column compact-column">
          <h4 className="column-title">Chamados / Em Atendimento</h4>
          <WaitingListPanel
            waitingList={waitingLine.waitingList}
            statusFilter={['chamado','em_atendimento']}
            onFinishConsultation={async (id, obs) => { await waitingLine.handleFinishConsultation(id, obs); await waitingLine.fetchWaitingLine(); }}
            onRemoveEntry={async (id) => { await waitingLine.handleRemoveEntry(id, 'cancelado_pelo_usuario'); await waitingLine.fetchWaitingLine(); }}
            fetchWaitingLine={waitingLine.fetchWaitingLine}
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