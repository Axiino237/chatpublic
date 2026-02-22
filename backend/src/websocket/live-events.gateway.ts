import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'events' })
export class LiveEventsGateway {
    @WebSocketServer()
    server: Server;

    // Send announcement to EVERYONE in the system
    sendGlobalAnnouncement(message: string, senderName: string) {
        this.server.emit('globalAnnouncement', {
            message,
            sender: senderName,
            timestamp: new Date(),
        });
    }

    // Handle Spotlight Room events
    broadcastSpotlightEvent(roomId: string, event: any) {
        this.server.to(roomId).emit('spotlightEvent', event);
    }

    @SubscribeMessage('joinEventRoom')
    handleJoinRoom(client: any, roomId: string) {
        client.join(roomId);
    }
}
