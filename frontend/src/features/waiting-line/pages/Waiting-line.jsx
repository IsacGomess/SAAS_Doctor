import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useWaitingLine } from '../services/useWaitingLine';
import { getWaitingLine } from '../services/waitingLineService';
import { WaitingListPanel } from '../components/WaitingListPanel';
import './Waiting-line.css';

const DEFAULT_CLINIC_AREA = 'Geral';

function WaitingLine() {
  const navigate = useNavigate();
  const auth = useAuth();

  const selectedClinicArea =
    auth.clinicArea || DEFAULT_CLINIC_AREA;

  const [clinicName, setClinicName] = useState(
    () => localStorage.getItem('clinicName') || ''
  );

  const waitingLine = useWaitingLine({
    clinicArea: selectedClinicArea,
    pollInterval: null,
    assignedUserId: auth.userId
  });

  const [clinicAreaInput, setClinicAreaInput] = useState('');
  const [showClinicAreaModal, setShowClinicAreaModal] = useState(false);
  const [clinicAreas, setClinicAreas] = useState([DEFAULT_CLINIC_AREA]);
  const [isLoadingClinicAreas, setIsLoadingClinicAreas] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadClinicName = async () => {
      if (!auth.clinicaId) {
        if (mounted) {
          setClinicName(
            localStorage.getItem('clinicName') || ''
          );
        }
        return;
      }

      try {
        const response = await fetch('/api/clinics/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const clinicJson = await response.json();

          const resolvedName =
            clinicJson?.clinica?.name ||
            localStorage.getItem('clinicName') ||
            '';

          if (mounted) {
            setClinicName(resolvedName);
          }

          if (resolvedName) {
            localStorage.setItem(
              'clinicName',
              resolvedName
            );
          } else {
            localStorage.removeItem('clinicName');
          }

          return;
        }
      } catch (error) {
        console.warn(
          '[WAITING_LINE] falha ao buscar nome da clínica:',
          error
        );
      }

      if (mounted) {
        setClinicName(
          localStorage.getItem('clinicName') || ''
        );
      }
    };

    loadClinicName();

    return () => {
      mounted = false;
    };
  }, [auth.clinicaId]);

  const handleOpenClinicAreaModal = async () => {
    setShowClinicAreaModal(true);
    setIsLoadingClinicAreas(true);

    try {
      const response = await getWaitingLine();

      const entries = Array.isArray(response)
        ? response
        : response?.waitingLine || [];

      const areas = entries
        .map((entry) => entry.clinicArea?.trim())
        .filter(Boolean);

      const uniqueAreas = [
        ...new Map(
          [
            DEFAULT_CLINIC_AREA,
            selectedClinicArea,
            ...areas
          ].map((area) => [
            area.toLowerCase(),
            area
          ])
        ).values()
      ];

      setClinicAreas(uniqueAreas);
    } catch (error) {
      console.error(
        'Erro ao buscar áreas da clínica:',
        error
      );

      setClinicAreas([DEFAULT_CLINIC_AREA]);
    } finally {
      setIsLoadingClinicAreas(false);
    }
  };

  const handleSetClinicArea = (
    area = clinicAreaInput
  ) => {
    const normalizedArea = area.trim();

    if (!normalizedArea) return;

    auth.setDoctorClinicArea(normalizedArea);

    setClinicAreaInput('');
    setShowClinicAreaModal(false);
  };

  const waitingCount =
    waitingLine.waitingList?.filter(
      (item) => item.status === 'aguardando'
    ).length || 0;

  const attendanceCount =
    waitingLine.waitingList?.filter(
      (item) =>
        item.status === 'chamado' ||
        item.status === 'em_atendimento'
    ).length || 0;

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
      <div className="dashboard-header waiting-header">

        <div className="waiting-header-main">

          <div className="d-flex align-items-center gap-3">
            <div className="waiting-header-icon">
              <i className="bi bi-hourglass-split"></i>
            </div>

            <div>
              <h3 className="waiting-header-title mb-0">
                Fila de Espera
              </h3>

              <small className="waiting-header-subtitle">
                {clinicName
                  ? clinicName
                  : 'Gerencie o fluxo de atendimento da clínica'}
              </small>
            </div>
          </div>

          <span className="waiting-plan-badge">
            <i className="bi bi-patch-check-fill me-2"></i>
            Assinatura Clínica Necessária
          </span>

        </div>

        {/* TOOLBAR */}
        <div className="waiting-toolbar">

          <div className="waiting-toolbar-actions">

            <button
              type="button"
              className="btn btn-light waiting-btn"
              onClick={() => {
                auth.refreshUserInfo();
                navigate('/dashboard/patients');
              }}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Voltar
            </button>

            <button
              type="button"
              className="btn btn-primary waiting-btn"
              onClick={waitingLine.fetchWaitingLine}
              disabled={waitingLine.isLoading}
            >
              <i
                className={`bi ${
                  waitingLine.isLoading
                    ? 'bi-arrow-repeat'
                    : 'bi-arrow-clockwise'
                } me-2`}
              ></i>

              {waitingLine.isLoading
                ? 'Atualizando...'
                : 'Atualizar fila'}
            </button>

          </div>

          {/* ÁREA DA CLÍNICA */}
          <div className="waiting-area-control">

            <div>
              <small className="waiting-area-label">
                Área da clínica
              </small>

              <div className="waiting-area-name">
                <i className="bi bi-geo-alt me-2"></i>
                {selectedClinicArea}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={handleOpenClinicAreaModal}
            >
              Alterar
            </button>

          </div>

        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="dashboard-content waiting-grid">

        {/* AGUARDANDO */}
        <div className="waiting-section">

          <div className="waiting-section-heading">
            <div>
              <span className="waiting-section-kicker">
                Em espera
              </span>

              <h4>
                Aguardando atendimento
              </h4>
            </div>

            <span className="waiting-count">
              {waitingCount}
            </span>
          </div>

          <WaitingListPanel
            waitingList={waitingLine.waitingList}
            statusFilter={['aguardando']}
            onCallPatient={async (id) => {
              await waitingLine.handleCallPatient(id);
              await waitingLine.fetchWaitingLine();
            }}
            fetchWaitingLine={
              waitingLine.fetchWaitingLine
            }
            isLoading={waitingLine.isLoading}
          />
        </div>

        {/* CHAMADOS / EM ATENDIMENTO */}
        <div className="waiting-section">

          <div className="waiting-section-heading">
            <div>
              <span className="waiting-section-kicker">
                Atendimento
              </span>

              <h4>
                Chamados / Em atendimento
              </h4>
            </div>

            <span className="waiting-count">
              {attendanceCount}
            </span>
          </div>

          <WaitingListPanel
            waitingList={waitingLine.waitingList}
            statusFilter={[
              'chamado',
              'em_atendimento'
            ]}
            onFinishConsultation={async (
              id,
              obs
            ) => {
              await waitingLine.handleFinishConsultation(
                id,
                obs
              );

              await waitingLine.fetchWaitingLine();
            }}
            onRemoveEntry={async (id) => {
              await waitingLine.handleRemoveEntry(
                id,
                'cancelado_pelo_usuario'
              );

              await waitingLine.fetchWaitingLine();
            }}
            fetchWaitingLine={
              waitingLine.fetchWaitingLine
            }
            isLoading={waitingLine.isLoading}
          />

        </div>

      </div>

      {/* MODAL DE SELEÇÃO DE ÁREA */}
      {showClinicAreaModal && (
        <div className="clinic-area-modal-overlay">

          <div className="clinic-area-modal">

            <h2>
              Selecione a Área da Clínica
            </h2>

            <p>
              Selecione uma área cadastrada ou
              informe uma nova área.
            </p>

            <div
              className="clinic-area-options"
              role="list"
              aria-label="Áreas cadastradas"
            >
              {isLoadingClinicAreas ? (
                <p>
                  Buscando áreas cadastradas...
                </p>
              ) : (
                clinicAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    className="btn btn-outline-secondary w-100 mb-2 text-start"
                    onClick={() =>
                      handleSetClinicArea(area)
                    }
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
              onChange={(e) =>
                setClinicAreaInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSetClinicArea();
                }
              }}
              className="clinic-area-input"
              autoFocus
            />

            <div className="modal-buttons">

              <button
                className="btn-confirm"
                onClick={() =>
                  handleSetClinicArea()
                }
                disabled={
                  !clinicAreaInput.trim()
                }
              >
                Confirmar
              </button>

              <button
                className="btn-cancel"
                onClick={() =>
                  setShowClinicAreaModal(false)
                }
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