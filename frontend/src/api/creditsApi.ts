import apiClient from './axiosInstance';

export const creditsApi = {
  getMyCredits: async () => {
    const { data } = await apiClient.get('/credits/me');
    return data.data;
  },

  getSustainabilityMetrics: async () => {
    const { data } = await apiClient.get('/sustainability/me');
    return data.data;
  },
};
