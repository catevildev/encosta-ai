import { API_URL } from '@env';

export const api = {
  baseURL: API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
}; 