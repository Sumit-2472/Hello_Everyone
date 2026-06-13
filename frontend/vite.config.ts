import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/v1/auth': 'http://localhost:4001',
      '/api/v1/users': 'http://localhost:4001',
      '/api/v1/returns': 'http://localhost:4002',
      '/api/v1/size-advisor': 'http://localhost:4002',
      '/api/v1/compatibility': 'http://localhost:4002',
      '/api/v1/passports': 'http://localhost:4003',
      '/api/v1/routing': 'http://localhost:4004',
      '/api/v1/recovery': 'http://localhost:4004',
      '/api/v1/listings': 'http://localhost:4005',
      '/api/v1/credits': 'http://localhost:4005',
      '/api/v1/sustainability': 'http://localhost:4005',
    },
  },
});
