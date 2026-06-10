import api from "../../../services/api"; // Ajuste o caminho para a sua instância do axios

// ✅ Exportação nomeada idêntica ao que o componente espera
export const createAppointment = async (appointmentData) => {
  const response = await api.post("/api/appointments/create", appointmentData);
  return response.data;
};

export const getAppointments = async (date) => {
  // Passa a data selecionada como query param (ex: /api/appointments/list?date=2026-06-10)
  const response = await api.get(`/api/appointments/list?date=${date}`);
  return response.data.appointments || [];
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await api.patch(`/api/appointments/${appointmentId}/status`, { status });
  return response.data;
};