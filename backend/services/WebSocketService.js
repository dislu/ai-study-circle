const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map of userId to socket instances
  }

  /**
   * Initialize WebSocket server with HTTP server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io'
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.email} connected via WebSocket`);
      
      // Store user connection
      if (!this.connectedUsers.has(socket.userId)) {
        this.connectedUsers.set(socket.userId, new Set());
      }
      this.connectedUsers.get(socket.userId).add(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.email} disconnected from WebSocket`);
        
        const userSockets = this.connectedUsers.get(socket.userId);
        if (userSockets) {
          userSockets.delete(socket);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(socket.userId);
          }
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle custom events
      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.user.email} joined room: ${room}`);
      });

      socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`User ${socket.user.email} left room: ${room}`);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId, event, data) {
    const userSockets = this.connectedUsers.get(userId.toString());
    if (userSockets && userSockets.size > 0) {
      userSockets.forEach(socket => {
        socket.emit(event, data);
      });
      return true;
    }
    return false;
  }

  /**
   * Send notification to all users in a room
   */
  sendToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Send document processing notifications
   */
  notifyDocumentProcessed(userId, document, status) {
    const notification = {
      type: 'document_processed',
      documentId: document._id,
      fileName: document.name,
      status: status,
      timestamp: new Date()
    };

    this.sendToUser(userId, 'notification', {
      type: 'notification',
      notification: {
        type: status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info',
        title: status === 'completed' ? 'Document Processed' : 
               status === 'failed' ? 'Processing Failed' : 'Processing Document',
        message: status === 'completed' ? `${document.name} has been successfully processed` :
                status === 'failed' ? `Failed to process ${document.name}` :
                `Processing ${document.name}...`,
        actionUrl: status === 'completed' ? `/documents/${document._id}` : null,
        actionText: status === 'completed' ? 'View Document' : null
      }
    });
  }

  /**
   * Send summary generation notifications
   */
  notifySummaryReady(userId, document, summary) {
    this.sendToUser(userId, 'notification', {
      type: 'summary_ready',
      notification: {
        type: 'info',
        title: 'Summary Ready',
        message: `Summary for "${document.name}" is now available`,
        actionUrl: `/documents/${document._id}/summary`,
        actionText: 'View Summary'
      },
      documentId: document._id,
      documentName: document.name,
      summary
    });
  }

  /**
   * Send exam generation notifications
   */
  notifyExamReady(userId, document, exam) {
    this.sendToUser(userId, 'notification', {
      type: 'exam_ready',
      notification: {
        type: 'info',
        title: 'Exam Generated',
        message: `Exam questions for "${document.name}" are ready`,
        actionUrl: `/documents/${document._id}/exam`,
        actionText: 'Take Exam'
      },
      documentId: document._id,
      documentName: document.name,
      exam
    });
  }

  /**
   * Send processing error notifications
   */
  notifyProcessingError(userId, document, error) {
    this.sendToUser(userId, 'notification', {
      type: 'processing_error',
      notification: {
        type: 'error',
        title: 'Processing Failed',
        message: `Failed to process "${document.name}": ${error}`,
        actionUrl: '/documents',
        actionText: 'View Documents'
      },
      documentId: document._id,
      fileName: document.name,
      error
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get user connection status
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId.toString());
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;