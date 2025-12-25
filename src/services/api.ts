import axios from 'axios';

export const api = axios.create({
  const API_URL = 'https://horizon-api.onrender.com';
  headers: {
    'Content-Type': 'application/json',
  },
});