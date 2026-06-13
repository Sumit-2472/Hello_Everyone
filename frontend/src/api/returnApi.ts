import apiClient from './axiosInstance';

export const returnApi = {
  predictReturnRisk: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post('/returns/predict-risk', payload);
    return data.data;
  },

  recommendSize: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post('/size-advisor/recommend', payload);
    return data.data;
  },

  checkCompatibility: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post('/compatibility/check', payload);
    return data.data;
  },
};
