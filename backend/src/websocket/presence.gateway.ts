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
import { PresenceService } from './presence.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private presenceService: PresenceService) { }

    async handleConnection(client: Socket) {
        // We expect userId to be passed in query or handshake
        const userId = client.handshake.query.userId as string;
        if (userId) {
            await this.presenceService.setOnline(userId);
            this.server.emit('userStatusChanged', { userId, status: 'online' });
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            await this.presenceService.setOffline(userId);
            this.server.emit('userStatusChanged', { userId, status: 'offline' });
        }
    }

    @SubscribeMessage('heartbeat')
    async handleHeartbeat(@MessageBody() userId: string) {
        await this.presenceService.setOnline(userId);
    }
}
