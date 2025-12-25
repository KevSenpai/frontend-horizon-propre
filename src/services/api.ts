import axios from 'axios';

// 1. On déclare la constante EN DEHORS de l'objet
const API_URL = 'https://horizon-api.onrender.com';

// 2. On utilise la constante dedans
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});