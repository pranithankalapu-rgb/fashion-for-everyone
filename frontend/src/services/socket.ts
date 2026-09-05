import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getClientSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
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
