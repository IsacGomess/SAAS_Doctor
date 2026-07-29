import api from '../../../services/api';

export const getPlansWeekly = async (limit = 5) => {
  const response = await api.get(`api/reports/plans-weekly?limit=${limit}`);
  return response.data || [];
};
