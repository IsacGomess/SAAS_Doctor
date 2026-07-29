import api from '../../../services/api';

export const getDashboardSummary = async () => {
  const response = await api.get('api/reports/dashboard-summary');
  return response.data;
};
