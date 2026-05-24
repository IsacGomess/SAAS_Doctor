import api from './api';

/**
 * Adiciona um novo membro (funcionário) à clínica do usuário logado
 * @param {Object} data - { name, email, password, role }
 * @returns {Promise}
 */
export const addMembro = async (data) => {
    try {
        const response = await api.post('/api/users/membros', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao adicionar membro' };
    }
};

/**
 * Lista todos os membros da clínica do usuário logado
 * @returns {Promise}
 */
export const getMembros = async () => {
    try {
        const response = await api.get('/api/users/membros');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao buscar membros' };
    }
};

/**
 * Remove um membro da clínica (apenas admin)
 * @param {string} membroId - ID do membro a remover
 * @returns {Promise}
 */
export const deleteMembro = async (membroId) => {
    try {
        const response = await api.delete(`/api/users/membros/${membroId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao remover membro' };
    }
};
