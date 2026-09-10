import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      email: string;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from auth payload or authorization header
      const token =
        client.handshake.auth?.token ||
        client.handshake.auth?.accessToken ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connection rejected: missing JWT token for socket ${client.id}`);
        client.disconnect();
        return;
      }

      const accessSecret =
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'super_secret_access_jwt_key_lead_dev_2026';

      const payload = await this.jwtService.verifyAsync(token, {
        secret: accessSecret,
      });

      // Attach authenticated user info to socket session
      client.data.user = {
        id: payload.sub,
        email: payload.email,
      };

      this.logger.log(`Client authenticated & connected: ${client.id} (user: ${payload.email})`);
    } catch {
      this.logger.warn(`Connection rejected: invalid JWT token for socket ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinList')
  handleJoinList(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { listId: string },
  ) {
    if (!data?.listId) {
      return { status: 'error', message: 'listId is required' };
    }
    const roomName = `list:${data.listId}`;
    client.join(roomName);
    this.logger.log(`Socket ${client.id} joined room ${roomName}`);
    return { status: 'success', event: 'joinedList', room: roomName };
  }

  @SubscribeMessage('leaveList')
  handleLeaveList(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { listId: string },
  ) {
    if (!data?.listId) {
      return { status: 'error', message: 'listId is required' };
    }
    const roomName = `list:${data.listId}`;
    client.leave(roomName);
    this.logger.log(`Socket ${client.id} left room ${roomName}`);
    return { status: 'success', event: 'leftList', room: roomName };
  }

  // --- Broadcast methods invoked by Task operations ---

  notifyTaskCreated(listId: string, task: any) {
    const roomName = `list:${listId}`;
    this.logger.log(`Emitting 'task:created' to room ${roomName} for task ${task.id}`);
    this.server.to(roomName).emit('task:created', task);
  }

  notifyTaskUpdated(listId: string, task: any) {
    const roomName = `list:${listId}`;
    this.logger.log(`Emitting 'task:updated' to room ${roomName} for task ${task.id}`);
    this.server.to(roomName).emit('task:updated', task);

    // If task was marked as completed, also emit task:completed as specified in PDF
    if (task.isCompleted) {
      this.logger.log(`Emitting 'task:completed' to room ${roomName} for task ${task.id}`);
      this.server.to(roomName).emit('task:completed', task);
    }
  }

  notifyTaskDeleted(listId: string, taskId: string) {
    const roomName = `list:${listId}`;
    this.logger.log(`Emitting 'task:deleted' to room ${roomName} for task ${taskId}`);
    this.server.to(roomName).emit('task:deleted', { taskId, listId });
  }
}
