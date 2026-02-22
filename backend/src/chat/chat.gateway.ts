import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { UseGuards, UseFilters } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GamificationService } from './gamification.service';
import { ModerationService } from '../moderation/moderation.service';
import { PresenceService } from '../websocket/presence.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BlocksService } from '../blocks/blocks.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
@UseGuards(WsJwtGuard)
@UseFilters(new WsExceptionFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    constructor(
        private moderationService: ModerationService,
        private chatService: ChatService,
        private gamificationService: GamificationService,
        private presenceService: PresenceService,
        private notificationsService: NotificationsService,
        private blocksService: BlocksService,
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    private async broadcastRoomUsers(roomId: string) {
        const userIds = await this.presenceService.getRoomUserIds(roomId);
        const users: any[] = [];

        for (const id of userIds) {
            if (!id || id.trim() === '') continue;
            if (id === 'SYSTEM_AI') {
                users.push({
                    id: 'SYSTEM_AI',
                    userId: 'SYSTEM_AI',
                    username: 'AI Assistant',
                    firstName: 'AI',
                    lastName: 'Assistant',
                    email: 'ai@system.local',
                    profilePictureUrl: null,
                    role: 'AI_SYSTEM',
                    status: 'Monitoring for safety',
                    badge: 'AI',
                    isOnline: true
                });
                continue;
            }
            // UUID validation regex
            if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                console.warn(`[ChatGateway] Skipping invalid user ID for broadcast: ${id}`);
                continue;
            }
            try {
                const user = await this.usersService.findOneById(id);
                if (user) {
                    users.push({
                        id: user.id,
                        userId: user.id, // For compatibility
                        username: user.username || user.email.split('@')[0],
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        profilePictureUrl: user.profilePictureUrl,
                        role: user.role,
                        status: user.status,
                        badge: user.badge,
                        isOnline: true
                    });
                }
            } catch (e) {
                console.error(`Error fetching user ${id} for room list:`, e);
            }
        }

        this.server.to(`room:${roomId}`).emit('activeUsers:update', users);
    }

    async handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        try {
            const token = client.handshake.auth?.token;
            if (token) {
                const payload = await this.jwtService.verifyAsync(token);
                // Attach user to client manually for immediate availability
                client.data.user = {
                    ...payload,
                    id: payload.sub,
                    userId: payload.sub
                };
                console.log(`[Debug] Manual Auth Success: ${client.data.user.username} (${client.data.user.id})`);

                await this.presenceService.setOnline(client.data.user.id);

                client.join(client.data.user.id); // join own room for private messages
                console.log(`User ${client.data.user.id} joined their private room.`);
            } else {
                console.log(`[Debug] Connection Unauthenticated: ${client.id} (No Token)`);
            }
        } catch (e) {
            console.log(`[Debug] Connection Auth Failed: ${client.id}`, e.message);
        }
    }

    async handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        const user = client.data.user;
        if (user) {
            await this.presenceService.setOffline(user.id);

            // Clean up all rooms user was in
            const rooms = await this.presenceService.getUserRooms(user.id);
            for (const roomId of rooms) {
                await this.presenceService.removeRoomUser(roomId, user.id);
                // Broadcast update to the room immediately
                await this.broadcastRoomUsers(roomId);
            }
            await this.presenceService.clearUserRooms(user.id);
        }
    }

    @SubscribeMessage('join')
    async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
        if (client.data?.user?.id === userId) {
            client.join(userId);
            return { status: 'ok', message: `Joined room ${userId}` };
        }
        return { status: 'error', message: 'Unauthorized room join' };
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { senderId: string; receiverId: string; content: string },
    ) {
        // Enforce Blocks
        const isBlockedByReceiver = await this.blocksService.isBlocked(data.receiverId, data.senderId);
        if (isBlockedByReceiver) {
            client.emit('error', 'Message not delivered. User has ignored you.');
            return;
        }

        const isBlockedBySender = await this.blocksService.isBlocked(data.senderId, data.receiverId);
        if (isBlockedBySender) {
            client.emit('error', 'You must unblock this user to message them.');
            return;
        }

        // Enforce Guest Media Restriction
        if (client.data.user?.isGuest && (data as any).type && ['IMAGE', 'AUDIO', 'GIF', 'image', 'audio', 'gif'].includes((data as any).type)) {
            client.emit('error', 'Guest accounts cannot send media (photos/audio/GIFs). Please register to unlock full features!');
            return;
        }

        // Check if muted
        if (await this.moderationService.checkMuteStatus(data.senderId)) {
            client.emit('error', 'You are currently muted.');
            return;
        }

        // Check for spam
        if (await this.moderationService.checkSpam(data.senderId, data.content)) {
            await this.moderationService.handleViolation(data.senderId, 'spamming', 1);
            client.emit('error', 'You have been muted for 1 minute for spamming repetitive messages.');
            return;
        }

        // Check for links/socials
        if (this.moderationService.containsLinksOrSocials(data.content)) {
            await this.moderationService.handleViolation(data.senderId, 'sharing external links or social handles');
            client.emit('error', 'Sharing links/socials is prohibited. You have been muted.');
            return;
        }

        // Check for profanity
        if (this.moderationService.containsProfanity(data.content)) {
            await this.moderationService.handleViolation(data.senderId, 'profanity');
            client.emit('error', 'Message blocked due to profanity. You have been muted.');
            return;
        }

        // Persist message as PRIVATE
        try {
            const messageType = (data as any).type?.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'PRIVATE';
            const savedMessage = await this.chatService.saveMessage(data.senderId, data.receiverId, data.content, undefined, messageType, true);

            // Award points and get sender info (using authenticated user from socket if available)
            const sender = client.data.user;
            const senderInfo = await this.gamificationService.awardPoints(data.senderId, 10);

            // Send real-time message (Private)
            const payload = {
                id: savedMessage.id,
                tempId: (data as any).tempId || (data as any).id,
                type: messageType,
                senderId: data.senderId,
                receiverId: data.receiverId,
                content: data.content,
                senderRole: senderInfo?.role || 'user',
                createdAt: savedMessage.createdAt,
            };

            this.server.to(data.receiverId).emit('receiveMessage', payload);
            // Only send delivery ACK to sender (not the full message again - they have the optimistic copy)
            client.emit('message_delivered', { messageId: savedMessage.id, tempId: (data as any).tempId || (data as any).id });

            // Trigger notification for the receiver
            const receiver = { id: data.receiverId } as any;
            await this.notificationsService.createNotification(
                receiver,
                'message',
                `New private message from @${sender?.username || 'someone'}`,
                data.senderId
            );
        } catch (e) {
            console.error('Private message delivery failed:', e);
            client.emit('delivery_failed', { reason: 'Internal server error', tempId: (data as any).tempId || (data as any).id });
        }
    }

    @SubscribeMessage('readReceipt')
    handleReadReceipt(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string; senderId: string },
    ) {
        this.server.to(data.senderId).emit('messageRead', {
            messageId: data.messageId,
        });
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { senderId: string; receiverId: string },
    ) {
        await this.presenceService.setTyping(data.senderId, data.receiverId);
        this.server.to(data.receiverId).emit('userTyping', {
            userId: data.senderId,
        });
    }

    @SubscribeMessage('joinPublic')
    async handleJoinPublic(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
        client.join(`room:${roomId}`);
        const user = client.data.user;
        if (user) {
            client.join(user.id); // Ensure user is in their own room for whispers
            console.log(`Client ${client.id} (User: ${user.id}) joined room: ${roomId}`);

            await this.presenceService.addRoomUser(roomId, user.id);
            await this.presenceService.addRoomUser(roomId, 'SYSTEM_AI'); // Ensure bot is in the list

            // Prevent double welcome messages for the same connection
            if (!client.data.welcomedRooms) {
                client.data.welcomedRooms = new Set<string>();
            }

            if (client.data.welcomedRooms.has(roomId)) {
                console.log(`[ChatGateway] User ${user.id} already welcomed to room ${roomId}, but refreshing user list.`);
                await this.broadcastRoomUsers(roomId);
                return;
            }
            client.data.welcomedRooms.add(roomId);

            const displayName = user.username || user.email?.split('@')[0] || 'Someone';

            // Broadcast join announcement to whole room
            const joinMsg = {
                roomId,
                senderId: 'SYSTEM_AI',
                type: 'JOIN',
                content: `👋 @${displayName} just joined the room!`,
                userEmail: 'System',
                username: 'System',
                role: 'AI_SYSTEM',
                badge: 'SYS',
                createdAt: new Date(),
            };
            this.server.to(`room:${roomId}`).emit('receivePublicMessage', joinMsg);

            // Personal welcome only to the joining user
            const welcomeMsg = {
                roomId,
                senderId: 'SYSTEM_AI',
                type: 'WELCOME',
                content: `✨ Welcome, @${displayName}! Follow community rules and enjoy the chat.`,
                userEmail: 'AI Assistant',
                username: 'AI Assistant',
                role: 'AI_SYSTEM',
                badge: 'AI',
                createdAt: new Date(),
            };
            client.emit('receivePublicMessage', welcomeMsg);

            // Broadcast updated user list
            await this.broadcastRoomUsers(roomId);
        }
    }

    @SubscribeMessage('leavePublic')
    async handleLeavePublic(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
        client.leave(`room:${roomId}`);
        console.log(`Client ${client.id} left room: ${roomId}`);
        const user = client.data.user;
        if (user) {
            await this.presenceService.removeRoomUser(roomId, user.id);
            await this.broadcastRoomUsers(roomId);
        }
    }

    @SubscribeMessage('sendPublicMessage')
    async handlePublicMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ) {
        try {
            // Enforce Guest Media Restriction
            if (client.data.user?.isGuest && data.type && ['IMAGE', 'AUDIO', 'GIF', 'image', 'audio', 'gif'].includes(data.type)) {
                client.emit('error', 'Guest accounts cannot send media (photos/audio/GIFs). Please register to unlock full features!');
                return;
            }

            console.log('[Debug] Step 1: Starting moderation checks for:', data.senderId);
            if (await this.moderationService.checkMuteStatus(data.senderId)) {
                console.log('[Debug] User is muted');
                client.emit('error', 'You are currently muted.');
                return;
            }
            console.log('[Debug] Step 2: Checking spam');
            if (await this.moderationService.checkSpam(data.senderId, data.content)) {
                console.log('[Debug] Spam detected');
                await this.moderationService.handleViolation(data.senderId, 'spamming', 1);
                client.emit('error', 'You have been muted for 1 minute for spamming repetitive messages.');
                return;
            }
            console.log('[Debug] Step 3: Checking links/socials');
            const hasForbiddenContent = this.moderationService.containsLinksOrSocials(data.content);
            if (hasForbiddenContent) {
                console.log('[Debug] Forbidden content detected');
                await this.moderationService.handleViolation(data.senderId, 'external_link_or_social_id');

                // Spec: Replace content with hidden message
                data.content = '⚠️ This message is hidden due to policy violation';
                data.isHidden = true;
                data.hiddenReason = 'external_link_or_social_id';

                client.emit('error', 'Sharing links/socials is prohibited. You have been muted for 24 hours.');
                client.emit('user_muted', { remainingTime: '24' });
            }

            console.log('[Debug] Step 4: Checking profanity');
            if (this.moderationService.containsProfanity(data.content) && !data.isHidden) {
                console.log('[Debug] Profanity detected');
                await this.moderationService.handleViolation(data.senderId, 'profanity');
                client.emit('error', 'Message blocked due to profanity. You have been muted.');
                return;
            }
            console.log('[Debug] Step 5: Moderation passed');

            // Tag Parsing Logic
            const taggedUserIds: string[] = [];
            const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
            const mentions = data.content.match(mentionRegex);

            if (mentions) {
                console.log('[Debug] Mentions found in content:', mentions);
                for (const mention of mentions) {
                    const username = mention.substring(1); // Remove @
                    try {
                        const taggedUser = await this.usersService.findOneByUsernameCaseInsensitive(username);
                        console.log(`[Debug] Lookup for ${username}: found ${taggedUser?.id}`);
                        if (taggedUser) {
                            taggedUserIds.push(taggedUser.id);
                        }
                    } catch (e) {
                        console.error('[Debug] Failed to lookup user:', username, e);
                    }
                }
            } else {
                console.log('[Debug] No mentions matched via regex');
            }

            // Get fresh user data for badge
            console.log('[Debug] Step 6: Awarding points');
            const sender = await this.gamificationService.awardPoints(data.senderId, 5);
            console.log('[Debug] Step 7: Points awarded');

            // Persist Public, Mention, or Image Message
            let messageType = taggedUserIds.length > 0 ? 'MENTION' : 'PUBLIC';
            if (data.type?.toUpperCase() === 'IMAGE') {
                messageType = 'IMAGE';
            }

            console.log(`[Debug] Final Message Type: ${messageType}, Tagged IDs: ${taggedUserIds}`);
            try {
                console.log('[Debug] Attempting to save message...');
                const savedMessage = await this.chatService.saveMessage(
                    data.senderId,
                    null,
                    data.content,
                    data.roomId,
                    messageType,
                    false,
                    taggedUserIds,
                    !!data.isHidden,
                    data.hiddenReason || null
                );

                // Emit delivery ACK to sender immediately
                client.emit('message_delivered', { messageId: savedMessage.id, tempId: (data as any).tempId || (data as any).id });

                // Prepare Payload
                const payload = {
                    id: savedMessage.id,
                    tempId: (data as any).tempId || (data as any).id,
                    type: messageType,
                    roomId: data.roomId,
                    senderId: data.senderId,
                    receiverId: null,
                    mentionedUserIds: taggedUserIds,
                    message: data.content,
                    content: data.content,
                    isHidden: !!data.isHidden,
                    hiddenReason: data.hiddenReason,
                    userEmail: client.data.user?.email || data.userEmail,
                    username: client.data.user?.username || (savedMessage.sender?.username) || (client.data.user?.email?.split('@')[0]) || data.userEmail.split('@')[0],
                    badge: sender?.badge,
                    profilePictureUrl: client.data.user?.profilePictureUrl || savedMessage.sender?.profilePictureUrl,
                    createdAt: savedMessage.createdAt,
                };

                // Broadcast logic
                const roomSockets = await this.server.in(`room:${data.roomId}`).fetchSockets();

                for (const targetSocket of roomSockets) {
                    const targetUserId = targetSocket.data.user?.id;
                    if (targetUserId) {
                        const isBlocked = await this.blocksService.isBlocked(targetUserId, data.senderId);
                        if (isBlocked) {
                            // Do not deliver message to user who blocked the sender
                            continue;
                        }
                    }
                    targetSocket.emit('receivePublicMessage', payload);
                }

                // Emit back to Sender (enriched) if not already in room loop (safe-guard)
                // client.emit('receivePublicMessage', payload); // No, the loop covers everyone including sender if they are in room. 
                // BUT: Sender socket is `client`. `fetchSockets` includes the sender? Yes usually.
                // Let's explicitly emit to sender just to be absolutely sure they get the enriched version with highlights.
                client.emit('receivePublicMessage', payload);

            } catch (e) {
                console.error('Public message delivery failed:', e);
                client.emit('delivery_failed', { reason: 'Failed to save message', tempId: (data as any).tempId || (data as any).id });
            }
        } catch (fatalError) {
            console.error('[Debug] Fatal crash in handlePublicMessage:', fatalError);
            client.emit('error', 'Internal server error processing message.');
        }
    }

    @SubscribeMessage('sendWhisper')
    async handleWhisper(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string; content: string; roomId?: string },
    ) {
        const sender = client.data.user;
        if (!sender) return;

        // Persistent Block Check
        const isBlocked = await this.blocksService.isBlocked(data.receiverId, sender.id);
        if (isBlocked) {
            client.emit('error', 'Message not delivered. User has ignored you.');
            return;
        }

        const isBlockedByMe = await this.blocksService.isBlocked(sender.id, data.receiverId);
        if (isBlockedByMe) {
            client.emit('error', 'You have blocked this user. Unblock them to send a whisper.');
            return;
        }

        // Persist Whisper
        try {
            const savedMessage = await this.chatService.saveMessage(
                sender.id,
                data.receiverId,
                data.content,
                data.roomId,
                'WHISPER',
                false // It's in public room, just visibility-restricted
            );

            // Emit delivery ACK to sender
            client.emit('message_delivered', { messageId: savedMessage.id, tempId: (data as any).tempId || (data as any).id });

            const receiver = await this.usersService.findOneById(data.receiverId);

            const messageData = {
                id: savedMessage.id,
                type: 'WHISPER',
                roomId: data.roomId,
                senderId: sender.id,
                receiverId: data.receiverId,
                receiverUsername: receiver?.username || receiver?.email?.split('@')[0] || 'Unknown',
                mentionedUserIds: [],
                message: data.content,
                content: data.content, // legacy
                isPrivate: false, // Inside public flow
                createdAt: savedMessage.createdAt,
                userEmail: sender.email,
                username: sender.username || sender.email.split('@')[0],
                badge: sender.badge
            };

            // Emit to Receiver
            this.server.to(data.receiverId).emit('receivePublicMessage', messageData);

            // Emit back to Sender (enriched)
            client.emit('receivePublicMessage', messageData);
            console.log('[Debug] Whisper delivered to:', data.receiverId);
        } catch (e) {
            console.error('Whisper delivery failed:', e);
            client.emit('delivery_failed', { reason: 'Failed to send whisper', tempId: (data as any).tempId || (data as any).id });
        }
    }

    @SubscribeMessage('heartbeat')
    async handleHeartbeat(@ConnectedSocket() client: Socket) {
        if (client.data?.user?.id) {
            await this.presenceService.setOnline(client.data.user.id);
        }
    }
}

