import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

interface JwtPayload {
  id: string;
  email: string;
  name: string;
}

// Store connected sockets: socketId → user info
// Keyed by socketId so multiple tabs of the same user are tracked separately.
// Use getOnlineUsers() to get a deduplicated list by userId for broadcasting.
const connectedSockets = new Map<string, { userId: string; email: string; name: string }>();

/** Returns one entry per unique userId (deduplicates multi-tab users). */
function getOnlineUsers(): { email: string; name: string }[] {
  const seen = new Set<string>();
  const result: { email: string; name: string }[] = [];
  for (const u of connectedSockets.values()) {
    if (!seen.has(u.userId)) {
      seen.add(u.userId);
      result.push({ email: u.email, name: u.name });
    }
  }
  return result;
}

export const setupSocketHandlers = (io: Server) => {
  // Socket authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      socket.userName = decoded.name;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.userName} (${socket.userEmail}) [Socket ID: ${socket.id}]`);

    // Track this socket connection (keyed by socketId, not userId)
    if (socket.userId) {
      connectedSockets.set(socket.id, {
        userId: socket.userId,
        email: socket.userEmail || '',
        name: socket.userName || '',
      });

      const online = getOnlineUsers();
      console.log(`👥 Total connected sockets: ${connectedSockets.size} | Unique users: ${online.length}`);

      // Broadcast deduplicated online users list
      io.emit('users:online', online);
    }

    // Join user's personal room for targeted notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Handle user typing (for future chat feature)
    socket.on('task:typing', (data: { taskId: string; userName: string }) => {
      socket.broadcast.emit('task:typing', data);
    });

    // Handle request for current online users (client asks on mount to get accurate count)
    socket.on('users:request', () => {
      socket.emit('users:online', getOnlineUsers());
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userName} [Socket ID: ${socket.id}]`);

      connectedSockets.delete(socket.id);

      const online = getOnlineUsers();
      console.log(`👥 Total connected sockets: ${connectedSockets.size} | Unique users: ${online.length}`);

      // Broadcast deduplicated online users list
      io.emit('users:online', online);
    });
  });
};

// Helper function to emit task events
export const emitTaskEvent = (io: Server, event: string, data: any) => {
  console.log(`📤 Emitting event: ${event}`, { taskId: data.task?.id, taskTitle: data.task?.title });
  io.emit(event, data);
};

// Helper function to emit to specific user
export const emitToUser = (io: Server, userId: string, event: string, data: any) => {
  console.log(`📤 Emitting to user ${userId}: ${event}`, { taskId: data.task?.id });
  io.to(`user:${userId}`).emit(event, data);
};

// Get connected unique users count
export const getConnectedUsersCount = (): number => {
  return getOnlineUsers().length;
};

// Get connected unique users
export const getConnectedUsers = () => {
  return getOnlineUsers();
};
