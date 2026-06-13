import apiClient from './axiosInstance';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data.data;
  },

  register: async (payload: { email: string; password: string; name: string }) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  getMe: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  },
};
