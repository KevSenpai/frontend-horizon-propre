import axios from 'axios';

// 1. DÉCLARER LA CONSTANTE ICI (En dehors de l'objet)
const API_URL = 'https://horizon-api.onrender.com';

// 2. CRÉER L'INSTANCE
export const api = axios.create({
  baseURL: API_URL, // Utilisation de la variable
  headers: {
    'Content-Type': 'application/json',
  },
});