import axios from 'axios';

// L'URL EXACTE trouvée dans vos logs Render
const API_URL = 'https://horizon-api-y8nb.onrender.com'; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});