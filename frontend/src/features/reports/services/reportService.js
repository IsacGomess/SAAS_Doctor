import api from '../../../services/api'; 

export const getAppointmentsMonthly = async () => {
  const response = await api.get('api/reports/appointments-monthly');
  return response.data;
};

export const getPatientsGrowth = async () => {
  const response = await api.get('api/reports/patients-growth');
  return response.data;
};

export const getWaitTimeMonthly = async () => {
  const response = await api.get('api/reports/wait-time-monthly');
  return response.data;
};

export const getPlansMonthly = async () => {
  const response = await api.get('api/reports/plans-monthly');
  return response.data;
};