import apiClient from './axiosInstance';

export const marketplaceApi = {
  getListings: async (params: Record<string, string | number | undefined>) => {
    const { data } = await apiClient.get('/listings', { params });
    return data.data;
  },

  getListingById: async (id: string) => {
    const { data } = await apiClient.get(`/listings/${id}`);
    return data.data;
  },

  purchaseListing: async (id: string) => {
    const { data } = await apiClient.post(`/listings/${id}/purchase`);
    return data.data;
  },
};
