import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ANAT_SECURITY_JWT_SECRET_KEY';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  sessionToken?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs
  private socketTokens: Map<string, string> = new Map(); // socketId -> sessionToken

  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://horus.anatsecurity.fr"]
          : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('✅ Socket.IO service initialized');
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { _id: string };
      
      if (!decoded || !decoded._id) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = decoded._id;
      socket.sessionToken = token;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  }

  private handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId;
    const sessionToken = socket.sessionToken;

    if (!userId || !sessionToken) {
      socket.disconnect();
      return;
    }

    console.log(`👤 User ${userId} connected (socket: ${socket.id})`);

    // Track user socket connection
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);
    this.socketTokens.set(socket.id, sessionToken);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`👤 User ${userId} disconnected (socket: ${socket.id})`);
      
      const userSocketsSet = this.userSockets.get(userId);
      if (userSocketsSet) {
        userSocketsSet.delete(socket.id);
        if (userSocketsSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketTokens.delete(socket.id);
    });

    // Send initial connection confirmation
    socket.emit('connected', { message: 'Socket connection established' });
  }

  /**
   * Terminate session by token - emit event to specific session
   */
  terminateSessionByToken(sessionToken: string) {
    if (!this.io) return;

    // Find all sockets with this token
    const socketsToTerminate: string[] = [];
    
    this.socketTokens.forEach((token, socketId) => {
      if (token === sessionToken) {
        socketsToTerminate.push(socketId);
      }
    });

    // Emit termination event to each socket
    socketsToTerminate.forEach(socketId => {
      const socket = this.io?.sockets.sockets.get(socketId);
      if (socket) {
        console.log(`🔴 Terminating session for socket ${socketId}`);
        socket.emit('session:terminated', {
          message: 'Your session has been terminated by an administrator',
          timestamp: new Date().toISOString(),
        });
        
        // Disconnect after a short delay to ensure message is received
        setTimeout(() => {
          socket.disconnect(true);
        }, 500);
      }
    });

    console.log(`🔴 Terminated ${socketsToTerminate.length} socket(s) for session`);
  }

  /**
   * Terminate all sessions for a user
   */
  terminateAllUserSessions(userId: string) {
    if (!this.io) return;

    const userSocketsSet = this.userSockets.get(userId);
    if (!userSocketsSet || userSocketsSet.size === 0) {
      console.log(`⚠️ No active sockets for user ${userId}`);
      return;
    }

    console.log(`🔴 Terminating all sessions for user ${userId} (${userSocketsSet.size} socket(s))`);

    userSocketsSet.forEach(socketId => {
      const socket = this.io?.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('session:terminated', {
          message: 'All your sessions have been terminated by an administrator',
          timestamp: new Date().toISOString(),
        });
        
        setTimeout(() => {
          socket.disconnect(true);
        }, 500);
      }
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get socket count for a user
   */
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Singleton instance
export const socketService = new SocketService();
