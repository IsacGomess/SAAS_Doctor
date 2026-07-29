import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useWaitingLine } from '../services/useWaitingLine';
import { getWaitingLine } from '../services/waitingLineService';
import { WaitingListPanel } from '../components/WaitingListPanel';
import './Waiting-line.css';

const DEFAULT_CLINIC_AREA = 'Geral';

function WaitingLine() {
  const navigate = useNavigate();
  const auth = useAuth(); // arquivos de autenticaçao global criados em jwt
  const selectedClinicArea = auth.clinicArea || DEFAULT_CLINIC_AREA;
  const waitingLine = useWaitingLine({
    clinicArea: selectedClinicArea,
    pollInterval: null,
    assignedUserId: auth.userId
  });

  const [clinicAreaInput, setClinicAreaInput] = useState('');
  const [showClinicAreaModal, setShowClinicAreaModal] = useState(false);
  const [clinicAreas, setClinicAreas] = useState([DEFAULT_CLINIC_AREA]);
  const [isLoadingClinicAreas, setIsLoadingClinicAreas] = useState(false);

  const handleOpenClinicAreaModal = async () => {
    setShowClinicAreaModal(true);
    setIsLoadingClinicAreas(true);

    try {
      // O backend não possui uma entidade separada de áreas. As áreas já
      // utilizadas pela clínica são obtidas das entradas existentes da fila.
      const response = await getWaitingLine();
      const entries = Array.isArray(response) ? response : (response?.waitingLine || []);
      const areas = entries
        .map((entry) => entry.clinicArea?.trim())
        .filter(Boolean);
      const uniqueAreas = [...new Map(
        [DEFAULT_CLINIC_AREA, selectedClinicArea, ...areas]
          .map((area) => [area.toLowerCase(), area])
      ).values()];

      setClinicAreas(uniqueAreas);
    } catch (error) {
      console.error('Erro ao buscar áreas da clínica:', error);
      setClinicAreas([DEFAULT_CLINIC_AREA]);
    } finally {
      setIsLoadingClinicAreas(false);
    }
  };

  const handleSetClinicArea = (area = clinicAreaInput) => {
    const normalizedArea = area.trim();
    if (normalizedArea) {
      auth.setDoctorClinicArea(normalizedArea);
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
            className="btn btn-outline-secondary header-action-btn me-3"
            onClick={() => {
              auth.refreshUserInfo();
              navigate('/dashboard/patients');
            }}
          >
            ← Voltar
          </button>
          <button
            type="button"
            className="btn btn-primary me-3"
            style={{ backgroundColor: '#1e6b65', borderColor: '#1e6b65' }}
            onClick={waitingLine.fetchWaitingLine}
            disabled={waitingLine.isLoading}
          >
            Atualizar Fila
          </button>

          {/* Seletor de Área da Clínica */}
          <div className="clinic-area-selector">
            <label>Área da Clínica:</label>
            <div className="clinic-area-display">
              <span className="clinic-area-badge">{selectedClinicArea}</span>
              <button
                className="btn btn-outline-light header-action-btn rounded"
                onClick={handleOpenClinicAreaModal}
              >
                Selecionar área
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
            <p>Selecione uma área cadastrada ou informe uma nova área.</p>

            <div className="clinic-area-options" role="list" aria-label="Áreas cadastradas">
              {isLoadingClinicAreas ? (
                <p>Buscando áreas cadastradas...</p>
              ) : (
                clinicAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    className="btn btn-outline-secondary w-100 mb-2 text-start"
                    onClick={() => handleSetClinicArea(area)}
                  >
                    {area}
                  </button>
                ))
              )}
            </div>

            <input
              type="text"
              placeholder="Ex: Clínica Geral, Pediatria, Dermatologia..."
              value={clinicAreaInput}
              onChange={(e) => setClinicAreaInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetClinicArea()}
              className="clinic-area-input"
              autoFocus
            />

            <div className="modal-buttons">
              <button
                className="btn-confirm"
                onClick={() => handleSetClinicArea()}
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