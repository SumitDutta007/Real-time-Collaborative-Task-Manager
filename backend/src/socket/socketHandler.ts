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

// Store connected users
const connectedUsers = new Map<string, { socketId: string; email: string; name: string }>();

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

    // Add user to connected users
    if (socket.userId) {
      connectedUsers.set(socket.userId, {
        socketId: socket.id,
        email: socket.userEmail || '',
        name: socket.userName || '',
      });

      console.log(`👥 Total connected users: ${connectedUsers.size}`);

      // Broadcast updated online users list
      io.emit('users:online', Array.from(connectedUsers.values()).map(u => ({
        email: u.email,
        name: u.name,
      })));
    }

    // Join user's personal room for targeted notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Handle user typing (for future chat feature)
    socket.on('task:typing', (data: { taskId: string; userName: string }) => {
      socket.broadcast.emit('task:typing', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userName} [Socket ID: ${socket.id}]`);
      
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`👥 Total connected users: ${connectedUsers.size}`);
        
        // Broadcast updated online users list
        io.emit('users:online', Array.from(connectedUsers.values()).map(u => ({
          email: u.email,
          name: u.name,
        })));
      }
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

// Get connected users count
export const getConnectedUsersCount = (): number => {
  return connectedUsers.size;
};

// Get connected users
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};
