import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { SOCKET_ROOMS } from '@pharmasyn/shared';
import {
  OrgStatus,
  UserRole,
  UserStatus,
  type JwtPayload,
} from '@pharmasyn/types';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET', 'pharmasyn-dev-secret'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, deletedAt: null },
        select: {
          status: true,
          emailVerifiedAt: true,
          role: true,
          pharmacy: { select: { status: true } },
          supplier: { select: { status: true } },
        },
      });
      const role = user?.role as UserRole | undefined;
      const status = user?.status as UserStatus | undefined;
      const organization =
        role === UserRole.PHARMACY ? user?.pharmacy : user?.supplier;
      const organizationAllowed =
        role === UserRole.ADMIN ||
        (organization?.status as OrgStatus | undefined) === OrgStatus.APPROVED;
      if (
        !user ||
        status !== UserStatus.ACTIVE ||
        !user.emailVerifiedAt ||
        !organizationAllowed
      ) {
        client.disconnect();
        return;
      }
      const room = SOCKET_ROOMS.USER(payload.sub);
      await client.join(room);
      const socketData = client.data as { userId?: string };
      socketData.userId = payload.sub;
      this.logger.debug(`Client connected: user ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const socketData = client.data as { userId?: string };
    this.logger.debug(`Client disconnected: ${socketData.userId ?? 'unknown'}`);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(SOCKET_ROOMS.USER(userId)).emit(event, data);
  }
}
