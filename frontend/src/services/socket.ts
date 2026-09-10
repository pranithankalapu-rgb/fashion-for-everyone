import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string) ||
  (import.meta.env.VITE_API_URL
    ? (import.meta.env.VITE_API_URL as string).replace(/\/api\/?$/, '')
    : '') ||
  (typeof window !== 'undefined' &&
  (window.location.hostname.includes('vercel.app') || window.location.hostname !== 'localhost')
    ? 'https://fashion-for-everyone-backend.onrender.com'
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'https://fashion-for-everyone-backend.onrender.com');

export function getClientSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function subscribeToColorArena(onUpdate: (combo: any) => void): () => void {
  const s = getClientSocket();
  s.emit('join:arena');
  s.on('color-combo:updated', onUpdate);

  return () => {
    s.off('color-combo:updated', onUpdate);
  };
}

export function subscribeToNotifications(role: string, onNotification: (notif: any) => void): () => void {
  const s = getClientSocket();
  s.emit('join:role', role);
  s.on('notification:new', onNotification);

  return () => {
    s.off('notification:new', onNotification);
  };
}
