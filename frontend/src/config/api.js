import { API_URL } from '@env';

export const api = {
  baseURL: API_URL || 'http://192.168.0.12:3000',
  headers: {
    'Content-Type': 'application/json',
  },
}; 