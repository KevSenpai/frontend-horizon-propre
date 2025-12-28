import { io, Socket } from 'socket.io-client';
import { api } from './api';

let socket: Socket | null = null;

export const connectSocket = () => {
  // On récupère l'URL de base de l'API (Render)
  const baseUrl = api.defaults.baseURL || '';
  
  if (!socket) {
    socket = io(baseUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;