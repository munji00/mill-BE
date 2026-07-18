import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  afterInit(server: Server) {
    this.logger.log("Socket.IO Gateway initialized");
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Clients pass tenantId in auth context or query string
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant_${tenantId}`);
      this.logger.log(`Client ${client.id} joined room: tenant_${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendToTenant(tenantId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`tenant_${tenantId}`).emit(event, payload);
    }
  }
}
