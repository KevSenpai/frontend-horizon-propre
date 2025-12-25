import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000', // L'adresse de votre Backend
  headers: {
    'Content-Type': 'application/json',
  },
});