import api from '../../../services/api';

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

export const getPatientAttendanceList = async () => {
    try {
        const response = await api.get('/api/patients/atendance-list');
        return response.data.patients || [];
    } catch (err) {
        throw err.response?.data || { message: 'Erro ao buscar lista de pacientes' };
    }
};

export const getMedicalRecords = async (patientId) => {
    try {
        const response = await api.get(`/api/patients/${patientId}/get-medical-records`);
        return response.data.records || [];
    } catch (err) {
        if (err.response?.status === 404) return [];
        throw err.response?.data || { message: 'Erro ao buscar histórico clínico' };
    }
};

export const getEvolutions = async (patientId) => {
    try {
        const response = await api.get(`/api/patients/${patientId}/get-evolutions`);
        return response.data.evolutions || [];
    } catch (err) {
        if (err.response?.status === 404) return [];
        throw err.response?.data || { message: 'Erro ao buscar evoluções' };
    }
};

export const getPrescriptions = async (patientId) => {
    try {
        const response = await api.get(`/api/patients/${patientId}/get-prescriptions`);
        return response.data.prescriptions || [];
    } catch (err) {
        if (err.response?.status === 404) return [];
        throw err.response?.data || { message: 'Erro ao buscar prescrições' };
    }
};

export const createPrescription = async (data) => {
    try {
        const response = await api.post('/api/patients/create-prescription', data);
        return response.data;
    } catch (err) {
        throw err.response?.data || { message: 'Erro ao criar prescrição' };
    }
};

export default {
    createMedicalRecord,
    createEvolution,
    createPrescription,
    getPatientAttendanceList,
    getMedicalRecords,
    getEvolutions,
    getPrescriptions,
};