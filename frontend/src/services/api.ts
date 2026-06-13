import axios from 'axios';

// Interface for type safety
export interface LoginData {
  email: string;
  password: string;
}

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

export const loginUser = (data: LoginData) => api.post('/login', data);

export default api;