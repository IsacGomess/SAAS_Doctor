import api from '../../../services/api';

/**
 * Serviço centralizado para Fila de Espera (Waiting Line)
 * Centraliza todas as requisições HTTP com a API do backend
 */

const WAITING_LINE_BASE_URL = '/api/waiting-line';

// ============================================================================
// CRIAR ENTRADA NA FILA
// ============================================================================
export const createWaitingLineEntry = async (data) => {
    try {
        const response = await api.post(`${WAITING_LINE_BASE_URL}/create`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao criar entrada na fila' };
    }
};

// ============================================================================
// LISTAR FILA DE ESPERA COM FILTROS
// ============================================================================
/**
 * Lista a fila de espera com filtros opcionais
 * @param {Object} filters - Filtros para a busca
 * @param {string} filters.status - ('aguardando', 'chamado', 'em_atendimento', 'finalizado', 'cancelado')
 * @param {string} filters.priority - ('normal', 'prioritario', 'emergencia')
 * @param {string} filters.flowStage - ('recepcao', 'triagem', 'espera', 'consulta', 'retorno', 'internacao')
 * @param {string} filters.clinicArea - Área da clínica
 * @returns {Promise<Object>} Retorna objeto com waitingLine array
 */
export const getWaitingLine = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.priority) queryParams.append('priority', filters.priority);
        if (filters.flowStage) queryParams.append('flowStage', filters.flowStage);
        if (filters.clinicArea) queryParams.append('clinicArea', filters.clinicArea);

        const query = queryParams.toString();
        const url = query ? `${WAITING_LINE_BASE_URL}/list?${query}` : `${WAITING_LINE_BASE_URL}/list`;
        
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao listar fila de espera' };
    }
};

// ============================================================================
// OBTER ENTRADA ESPECÍFICA DA FILA
// ============================================================================
/**
 * Obtém detalhes completos de uma entrada da fila
 * @param {string} id - ID da entrada na fila
 * @returns {Promise<Object>} Retorna objeto com dados da entrada
 */
export const getWaitingLineById = async (id) => {
    try {
        const response = await api.get(`${WAITING_LINE_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao obter entrada da fila' };
    }
};

// ============================================================================
// CHAMAR PACIENTE
// ============================================================================
/**
 * Chama o paciente (atualiza status para 'chamado')
 * @param {string} id - ID da entrada na fila
 * @returns {Promise<Object>} Retorna entrada atualizada
 */
export const callPatient = async (id) => {
    try {
        const response = await api.patch(`${WAITING_LINE_BASE_URL}/${id}/call`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao chamar paciente' };
    }
};

// ============================================================================
// ATUALIZAR STATUS
// ============================================================================
/**
 * Atualiza o status da entrada na fila
 * @param {string} id - ID da entrada na fila
 * @param {Object} data - Dados para atualizar
 * @param {string} data.status - Novo status
 * @param {string} data.observations - Observações (opcional)
 * @returns {Promise<Object>} Retorna entrada atualizada
 */
export const updateWaitingLineStatus = async (id, data) => {
    try {
        const response = await api.patch(`${WAITING_LINE_BASE_URL}/${id}/status`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao atualizar status' };
    }
};

// ============================================================================
// INICIAR ATENDIMENTO (Alias para updateWaitingLineStatus)
// ============================================================================
/**
 * Inicia o atendimento (atualiza para 'em_atendimento')
 * @param {string} id - ID da entrada na fila
 * @param {string|null} assignedTo - ID do usuário que iniciou o atendimento
 * @returns {Promise<Object>} Retorna entrada atualizada
 */
export const startAttendance = async (id, assignedTo = null) => {
    const data = { status: 'em_atendimento' };
    if (assignedTo) data.assignedTo = assignedTo;
    return updateWaitingLineStatus(id, data);
};

// ============================================================================
// CANCELAR ENTRADA NA FILA
// ============================================================================
/**
 * Cancela uma entrada na fila
 * @param {string} id - ID da entrada na fila
 * @param {string} cancelledReason - Motivo do cancelamento
 * @returns {Promise<Object>} Retorna entrada cancelada
 */
export const cancelWaitingLine = async (id, cancelledReason) => {
    try {
        const response = await api.patch(`${WAITING_LINE_BASE_URL}/${id}/cancel`, { 
            cancelledReason 
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao cancelar entrada na fila' };
    }
};

// ============================================================================
// FINALIZAR CONSULTA (Alias para updateWaitingLineStatus)
// ============================================================================
/**
 * Finaliza a consulta (atualiza para 'finalizado')
 * @param {string} id - ID da entrada na fila
 * @param {string} observations - Observações/Evolução da consulta
 * @returns {Promise<Object>} Retorna entrada atualizada
 */
export const finishConsultation = async (id, observations = '') => {
    return updateWaitingLineStatus(id, { 
        status: 'finalizado',
        observations 
    });
};
