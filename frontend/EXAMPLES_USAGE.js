/**
 * EXEMPLOS DE USO - Sistema de Fila de Espera
 * 
 * Este arquivo contém exemplos práticos de como usar os hooks e serviços
 * do sistema de fila de espera.
 */

// ============================================================================
// EXEMPLO 1: Usar o Hook useAuth em um componente
// ============================================================================

import { useAuth } from '../hooks/useAuth';

function HeaderExample() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <p>Carregando...</p>;
  }

  return (
    <div>
      <h1>Bem-vindo, Dr(a). {auth.userName}</h1>
      <p>ID: {auth.userId}</p>
      <p>Área: {auth.clinicArea || 'Não definida'}</p>
      
      <button onClick={() => auth.setDoctorClinicArea('Cardiologia')}>
        Definir Área
      </button>
      
      <button onClick={() => auth.logout()}>
        Sair
      </button>
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Usar o Hook useWaitingLine com polling
// ============================================================================

import { useWaitingLine } from '../hooks/useWaitingLine';

function ListExample() {
  const waitingLine = useWaitingLine({
    pollInterval: 15000,  // 15 segundos
    clinicArea: 'Pediatria'
  });

  return (
    <div>
      <h2>Fila de Espera ({waitingLine.getWaitingCount()})</h2>
      
      {waitingLine.isLoading && <p>Carregando...</p>}
      {waitingLine.error && <p style={{ color: 'red' }}>{waitingLine.error}</p>}

      <ul>
        {waitingLine.waitingList.map(entry => (
          <li key={entry._id}>
            #{entry.lineNumber} - {entry.patientId?.name}
            
            <button 
              onClick={() => waitingLine.handleCallPatient(entry._id)}
              disabled={waitingLine.isLoading}
            >
              Chamar
            </button>
            
            <button 
              onClick={() => waitingLine.handleStartAttendance(entry._id)}
              disabled={waitingLine.isLoading}
            >
              Iniciar Atendimento
            </button>
          </li>
        ))}
      </ul>

      <p>Status do polling: {waitingLine.isPolling ? 'Ativo' : 'Pausado'}</p>
      <button onClick={() => waitingLine.togglePolling(!waitingLine.isPolling)}>
        {waitingLine.isPolling ? 'Pausar' : 'Retomar'} Atualização
      </button>
    </div>
  );
}

// ============================================================================
// EXEMPLO 3: Usar os serviços diretamente (sem hooks)
// ============================================================================

import { 
  getWaitingLine, 
  callPatient, 
  startAttendance,
  finishConsultation 
} from '../services/waitingLineService';

async function ServiceExample() {
  try {
    // Buscar fila com filtros
    const response = await getWaitingLine({
      status: 'aguardando',
      clinicArea: 'Cardiologia',
      priority: 'emergencia'
    });

    console.log(`Total de pacientes: ${response.count}`);
    console.log('Pacientes:', response.waitingLine);

    // Chamar primeiro paciente
    if (response.waitingLine.length > 0) {
      const firstPatient = response.waitingLine[0];
      
      const callResponse = await callPatient(firstPatient._id);
      console.log('Paciente chamado:', callResponse.message);

      // Iniciar atendimento
      const attendResponse = await startAttendance(firstPatient._id);
      console.log('Atendimento iniciado:', attendResponse.entry);

      // Finalizar atendimento com observações
      const finishResponse = await finishConsultation(
        firstPatient._id, 
        'Paciente apresenta febre e tosse. Prescrito antibiótico.'
      );
      console.log('Consulta finalizada:', finishResponse.entry);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

// ============================================================================
// EXEMPLO 4: Filtrar lista localmente
// ============================================================================

function FilterExample() {
  const waitingLine = useWaitingLine();

  // Filtrar apenas pacientes urgentes
  const emergencyPatients = waitingLine.getFilteredList(['emergencia']);

  // Contar por prioridade
  const normalCount = waitingLine.getPriorityCount('normal');
  const priorityCount = waitingLine.getPriorityCount('prioritario');
  const emergencyCount = waitingLine.getPriorityCount('emergencia');

  return (
    <div>
      <h2>Estatísticas</h2>
      <p>Normal: {normalCount}</p>
      <p>Prioritário: {priorityCount}</p>
      <p>Emergência: {emergencyCount}</p>

      <h3>Emergências ({emergencyPatients.length})</h3>
      <ul>
        {emergencyPatients.map(entry => (
          <li key={entry._id}>{entry.patientId?.name}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXEMPLO 5: Componente com seleção de paciente
// ============================================================================

import { useState } from 'react';

function SelectionExample() {
  const waitingLine = useWaitingLine();
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = async (entryId) => {
    try {
      await waitingLine.handleSelectPatient(entryId);
      setSelectedId(entryId);
    } catch (error) {
      console.error('Erro ao selecionar:', error);
    }
  };

  return (
    <div>
      <div style={{ flex: 1 }}>
        <h3>Pacientes</h3>
        {waitingLine.waitingList.map(entry => (
          <div 
            key={entry._id}
            style={{ 
              padding: '10px', 
              margin: '5px',
              backgroundColor: selectedId === entry._id ? '#ccc' : '#fff',
              border: '1px solid #ddd',
              cursor: 'pointer'
            }}
            onClick={() => handleSelect(entry._id)}
          >
            {entry.patientId?.name}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <h3>Detalhes</h3>
        {waitingLine.selectedPatient ? (
          <div>
            <p><strong>Nome:</strong> {waitingLine.selectedPatient.patientId?.name}</p>
            <p><strong>Status:</strong> {waitingLine.selectedPatient.status}</p>
            <p><strong>Prioridade:</strong> {waitingLine.selectedPatient.priority}</p>
            
            <button 
              onClick={() => 
                waitingLine.handleFinishConsultation(
                  waitingLine.selectedPatient._id,
                  'Paciente evoluindo bem'
                )
              }
            >
              Finalizar
            </button>
          </div>
        ) : (
          <p>Selecione um paciente</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 6: Usar jwtUtils para extrair informações do token
// ============================================================================

import { 
  getUserIdFromToken,
  getUserNameFromToken,
  getClinicAreaFromStorage,
  getUserInfoFromToken,
  isTokenExpired
} from '../utils/jwtUtils';

function JWTExample() {
  const userId = getUserIdFromToken();
  const userName = getUserNameFromToken();
  const clinicArea = getClinicAreaFromStorage();
  const fullInfo = getUserInfoFromToken();
  const expired = isTokenExpired();

  return (
    <div>
      <p>ID: {userId}</p>
      <p>Nome: {userName}</p>
      <p>Área: {clinicArea}</p>
      <p>Token expirado: {expired ? 'Sim' : 'Não'}</p>
      <pre>{JSON.stringify(fullInfo, null, 2)}</pre>
    </div>
  );
}

// ============================================================================
// EXEMPLO 7: Dashboard simplificado
// ============================================================================

function SimplifiedDashboard() {
  const auth = useAuth();
  const waitingLine = useWaitingLine({
    clinicArea: auth.clinicArea
  });

  if (auth.isLoading) return <div>Carregando...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Coluna esquerda */}
      <div>
        <h2>Fila ({waitingLine.getWaitingCount()})</h2>
        
        {waitingLine.waitingList
          .filter(e => ['aguardando', 'chamado'].includes(e.status))
          .map(entry => (
          <div 
            key={entry._id} 
            style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
          >
            <h4>#{entry.lineNumber} - {entry.patientId?.name}</h4>
            <p>Status: {entry.status}</p>
            
            {entry.status === 'aguardando' && (
              <button onClick={() => waitingLine.handleCallPatient(entry._id)}>
                Chamar
              </button>
            )}
            
            {entry.status === 'chamado' && (
              <button onClick={() => waitingLine.handleStartAttendance(entry._id)}>
                Iniciar
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Coluna direita */}
      <div>
        <h2>Prontuário</h2>
        {waitingLine.selectedPatient ? (
          <div>
            <h3>{waitingLine.selectedPatient.patientId?.name}</h3>
            <p>Status: {waitingLine.selectedPatient.status}</p>
            
            {waitingLine.selectedPatient.status === 'em_atendimento' && (
              <div>
                <textarea 
                  placeholder="Evolução..."
                  id="evolution"
                  rows={5}
                />
                <button onClick={() => {
                  const obs = document.getElementById('evolution').value;
                  waitingLine.handleFinishConsultation(
                    waitingLine.selectedPatient._id,
                    obs
                  );
                }}>
                  Finalizar
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>Selecione um paciente</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 8: Tratamento de erros
// ============================================================================

async function ErrorHandlingExample() {
  const waitingLine = useWaitingLine();

  try {
    // Se houver erro na busca
    if (waitingLine.error) {
      console.error('Erro da fila:', waitingLine.error);
      alert('Erro ao carregar fila: ' + waitingLine.error);
      return;
    }

    // Tentar chamar paciente
    try {
      await waitingLine.handleCallPatient('invalid-id');
    } catch (error) {
      console.error('Erro ao chamar paciente:', error);
      // Mostrar mensagem de erro ao usuário
      alert('Paciente não encontrado');
    }

    // Tentar finalizar sem observações
    if (!evolution.trim()) {
      alert('Adicione uma observação antes de finalizar');
      return;
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// ============================================================================
// EXEMPLO 9: Custom Hook combinando Auth + WaitingLine
// ============================================================================

function useDoctorSession() {
  const auth = useAuth();
  const waitingLine = useWaitingLine({
    clinicArea: auth.clinicArea
  });

  return {
    ...auth,
    ...waitingLine,
    isReady: !auth.isLoading && auth.isAuthenticated && !!auth.clinicArea
  };
}

// Usando o custom hook
function MyComponent() {
  const session = useDoctorSession();

  if (!session.isReady) return <div>Preparando...</div>;

  return (
    <div>
      <p>Dr(a). {session.userName}</p>
      <p>Pacientes na fila: {session.getWaitingCount()}</p>
    </div>
  );
}

export {
  HeaderExample,
  ListExample,
  FilterExample,
  SelectionExample,
  JWTExample,
  SimplifiedDashboard,
  ErrorHandlingExample,
  useDoctorSession
};
