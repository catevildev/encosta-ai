import { API_URL } from '@env';

export const api = {
  baseURL: API_URL || 'http://192.168.3.23:3000',
  headers: {
    'Content-Type': 'application/json',
  },
}; 