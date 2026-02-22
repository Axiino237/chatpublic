import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(WsJwtGuard)
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        const user = client.data.user;
        const userId = user?.sub;
        if (userId) {
            client.join(`notifications_${userId}`);
            console.log(`Notifications client connected: ${client.id} (User: ${userId})`);
        }
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user;
        const userId = user?.sub;
        if (userId) {
            client.leave(`notifications_${userId}`);
        }
    }

    sendNotification(userId: string, notification: any) {
        this.server.to(`notifications_${userId}`).emit('newNotification', notification);
    }
}
