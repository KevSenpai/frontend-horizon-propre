import axios from 'axios';

// L'URL de votre Backend
const API_URL = 'https://horizon-api-y8nb.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR MAGIQUE ---
api.interceptors.request.use(
  (config) => {
    // 1. On cherche le token stocké
    const token = localStorage.getItem('access_token');
    
    // 2. Si on l'a, on l'ajoute aux headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Optionnel : Gérer l'expiration du token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si on se fait rejeter, on vide le token et on redirige vers login
      // (Attention : window.location force un rechargement, c'est brutal mais efficace)
      if (window.location.pathname !== '/login') {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);