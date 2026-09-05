import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    // Join role-based room
    socket.on('join:role', (role: string) => {
      if (role) {
        socket.join(`role:${role.toLowerCase()}`);
      }
    });

    // Join color voting arena room
    socket.on('join:arena', () => {
      socket.join('color-arena');
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function emitColorVoteUpdate(comboData: any) {
  if (io) {
    io.emit('color-combo:updated', comboData);
  }
}

export function emitNotification(notification: {
  type: string;
  title: string;
  message: string;
  recipientRole?: string;
  orderId?: string;
  productId?: string;
}) {
  if (io) {
    if (notification.recipientRole) {
      io.to(`role:${notification.recipientRole.toLowerCase()}`).emit('notification:new', notification);
    }
    // Also broadcast to general channel
    io.emit('notification:new', notification);
  }
}
