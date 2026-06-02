import api from '../../services/api';

export const createMedicalRecord = async (data) => {
    try {
        const response = await api.post('/api/patients/create-medical-record', data);
        return response.data;
    } catch (err) {
        throw err.response?.data || { message: 'Erro ao criar prontuário' };
    }
};

export const createEvolution = async (data) => {
    try {
        const response = await api.post('/api/patients/create-evolution', data);
        return response.data;
    } catch (err) {
        throw err.response?.data || { message: 'Erro ao criar evolução' };
    }
};

export default {
    createMedicalRecord,
    createEvolution
};
