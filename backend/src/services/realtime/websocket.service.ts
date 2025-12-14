/**
 * WebSocket Service for Real-Time Updates
 * Provides live updates for:
 * - GPS tracking
 * - Schedule changes
 * - Dashboard metrics
 * - Notifications
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';


import { createLogger } from '../../utils/logger';

const logger = createLogger('websocket');
// Simple JWT verification (for real implementation, use proper auth service)
const verifyToken = async (token: string) => {
  const secret = process.env.JWT_SECRET || 'development-secret-key';
  return jwt.verify(token, secret) as any;
};

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      },
      path: '/ws'
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = await verifyToken(token);
        socket.user = {
          id: decoded.userId,
          organizationId: decoded.organizationId,
          role: decoded.role
        };

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    logger.info('[WebSocket] Server initialized');
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.user!.id;
    const organizationId = socket.user!.organizationId;

    logger.info(`[WebSocket] User ${userId} connected (socket: ${socket.id})`);

    // Track connection
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socket.id);

    // Join organization room for broadcasts
    socket.join(`org:${organizationId}`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Subscribe to specific channels based on role
    this.handleSubscriptions(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`[WebSocket] User ${userId} disconnected (socket: ${socket.id})`);
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    });
  }

  /**
   * Handle channel subscriptions based on user role
   */
  private handleSubscriptions(socket: AuthenticatedSocket) {
    const role = socket.user!.role;

    // Subscribe to GPS updates for authorized roles
    if (['FOUNDER', 'SCHEDULER', 'FIELD_SUPERVISOR'].includes(role)) {
      socket.on('subscribe:gps', () => {
        socket.join(`gps:${socket.user!.organizationId}`);
        logger.info(`[WebSocket] ${socket.user!.id} subscribed to GPS updates`);
      });
    }

    // Subscribe to schedule updates
    socket.on('subscribe:schedule', () => {
      socket.join(`schedule:${socket.user!.organizationId}`);
      logger.info(`[WebSocket] ${socket.user!.id} subscribed to schedule updates`);
    });

    // Subscribe to dashboard metrics
    socket.on('subscribe:dashboard', (dashboardName: string) => {
      socket.join(`dashboard:${socket.user!.organizationId}:${dashboardName}`);
      logger.info(`[WebSocket] ${socket.user!.id} subscribed to ${dashboardName} dashboard`);
    });

    // Subscribe to notifications
    socket.on('subscribe:notifications', () => {
      socket.join(`notifications:${socket.user!.id}`);
      logger.info(`[WebSocket] ${socket.user!.id} subscribed to notifications`);
    });

    // Caregivers subscribe to their own visit updates
    if (['CAREGIVER', 'DSP_BASIC', 'DSP_MED'].includes(role)) {
      socket.on('subscribe:my-visits', () => {
        socket.join(`visits:${socket.user!.id}`);
        logger.info(`[WebSocket] Caregiver ${socket.user!.id} subscribed to visit updates`);
      });
    }

    // Handle unsubscribe
    socket.on('unsubscribe', (channel: string) => {
      socket.leave(channel);
      logger.info(`[WebSocket] ${socket.user!.id} unsubscribed from ${channel}`);
    });
  }

  /**
   * Broadcast GPS update to all subscribers
   */
  broadcastGPSUpdate(organizationId: string, update: any) {
    if (!this.io) return;

    this.io.to(`gps:${organizationId}`).emit('gps:update', update);
  }

  /**
   * Broadcast schedule change
   */
  broadcastScheduleChange(organizationId: string, change: any) {
    if (!this.io) return;

    this.io.to(`schedule:${organizationId}`).emit('schedule:change', change);

    // Also notify affected caregiver
    if (change.caregiverId) {
      this.io.to(`visits:${change.caregiverId}`).emit('visit:updated', change);
    }
  }

  /**
   * Broadcast dashboard metric update
   */
  broadcastDashboardUpdate(organizationId: string, dashboardName: string, metrics: any) {
    if (!this.io) return;

    this.io.to(`dashboard:${organizationId}:${dashboardName}`).emit('dashboard:update', metrics);
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId: string, notification: any) {
    if (!this.io) return;

    this.io.to(`notifications:${userId}`).emit('notification', notification);
  }

  /**
   * Broadcast to entire organization
   */
  broadcastToOrganization(organizationId: string, event: string, data: any) {
    if (!this.io) return;

    this.io.to(`org:${organizationId}`).emit(event, data);
  }

  /**
   * Send message to specific user (all their connections)
   */
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  /**
   * Get server instance for external use
   */
  getServer(): SocketIOServer | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();
