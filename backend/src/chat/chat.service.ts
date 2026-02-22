import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { BlocksService } from '../blocks/blocks.service';
import { encrypt, decrypt } from '../common/encryption.util';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        private blocksService: BlocksService,
    ) { }

    async saveMessage(
        senderId: string,
        receiverId: string | null,
        content: string,
        roomId?: string | null,
        type: string = 'text',
        isPrivate: boolean = false,
        taggedUserIds: string[] = [],
        isHidden: boolean = false,
        hiddenReason: string | null = null
    ): Promise<Message> {
        const isEncryptedType = ['PRIVATE', 'IMAGE', 'WHISPER'].includes(type.toUpperCase());
        const messageData = {
            senderId,
            receiverId,
            content: isEncryptedType ? encrypt(content) : content,
            roomId,
            type,
            isPrivate,
            taggedUserIds,
            isHidden,
            hiddenReason
        };
        const message = this.messageRepository.create(messageData as any) as unknown as Message;
        return this.messageRepository.save(message);
    }

    private transformMessage(message: Message) {
        return {
            id: message.id,
            type: message.type,
            roomId: message.roomId,
            senderId: message.senderId,
            receiverId: message.receiverId,
            mentionedUserIds: message.taggedUserIds || [],
            message: message.isHidden ? (message.hiddenReason === 'external_link_or_social_id' ? '⚠️ This message is hidden due to policy violation' : 'Content hidden') : (['PRIVATE', 'IMAGE', 'WHISPER'].includes(message.type.toUpperCase()) ? decrypt(message.content) : message.content),
            content: message.isHidden ? '⚠️ This message is hidden due to policy violation' : (['PRIVATE', 'IMAGE', 'WHISPER'].includes(message.type.toUpperCase()) ? decrypt(message.content) : message.content),
            isHidden: message.isHidden,
            hiddenReason: message.hiddenReason,
            createdAt: message.createdAt,
            username: message.sender?.username || (message.sender?.email ? (message.sender.email.split('@')[0]) : 'Unknown'),
            receiverUsername: message.receiver?.username || (message.receiver?.email ? (message.receiver.email.split('@')[0]) : undefined),
            userEmail: message.sender?.email || '',
            badge: message.sender?.badge,
            profilePictureUrl: message.sender?.profilePictureUrl,
        };
    }

    async getRoomMessages(roomId: string, userId?: string): Promise<any[]> {
        const query = this.messageRepository.createQueryBuilder('message')
            .leftJoinAndSelect('message.sender', 'sender')
            .leftJoinAndSelect('message.receiver', 'receiver')
            .where('message.roomId = :roomId', { roomId })
            .andWhere('(message.type IN (:...publicTypes) OR (message.type = :whisperType AND (message.senderId = :userId OR message.receiverId = :userId)))', {
                roomId,
                publicTypes: ['PUBLIC', 'MENTION', 'IMAGE'],
                whisperType: 'WHISPER',
                userId: userId || 'none'
            });

        // Filter out messages from users blocked by the current user
        if (userId) {
            const blockedUsers = await this.blocksService.getBlockedUsers(userId);
            const blockedUserIds = blockedUsers.map(b => b.blocked.id);
            if (blockedUserIds.length > 0) {
                query.andWhere('message.senderId NOT IN (:...blockedUserIds)', { blockedUserIds });
            }
        }

        const messages = await query.orderBy('message.createdAt', 'ASC')
            .take(100)
            .getMany();

        return messages.map(msg => this.transformMessage(msg));
    }

    async getPrivateMessages(user1Id: string, user2Id: string): Promise<any[]> {
        // Check if user2 is blocked by user1
        const isBlocked = await this.blocksService.isBlocked(user1Id, user2Id);
        if (isBlocked) return [];

        const messages = await this.messageRepository.find({
            where: [
                { senderId: user1Id, receiverId: user2Id, type: 'PRIVATE' },
                { senderId: user1Id, receiverId: user2Id, type: 'IMAGE' },
                { senderId: user2Id, receiverId: user1Id, type: 'PRIVATE' },
                { senderId: user2Id, receiverId: user1Id, type: 'IMAGE' },
            ],
            order: { createdAt: 'ASC' },
            relations: ['sender'],
            take: 100
        });
        return messages.map(msg => this.transformMessage(msg));
    }

    // ... existing getters can be deprecated or kept ...
    async getConversation(user1Id: string, user2Id: string): Promise<Message[]> {
        return this.messageRepository.find({
            where: [
                { senderId: user1Id, receiverId: user2Id },
                { senderId: user2Id, receiverId: user1Id },
            ],
            order: { createdAt: 'ASC' },
            relations: ['sender', 'receiver'],
        });
    }

    async getAllMessages(): Promise<Message[]> {
        return this.messageRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['sender', 'receiver'],
            take: 100
        });
    }

    async getInbox(userId: string): Promise<any[]> {
        // Find latest message for each conversation
        const subQuery = this.messageRepository
            .createQueryBuilder('message')
            .select('CASE WHEN message.senderId = :userId THEN message.receiverId ELSE message.senderId END', 'partner_id')
            .addSelect('MAX(message.createdAt)', 'max_date')
            .where('message.type IN (:...types)', { types: ['PRIVATE', 'IMAGE'] })
            .andWhere('(message.senderId = :userId OR message.receiverId = :userId)')
            .groupBy('partner_id');

        const inbox = await this.messageRepository
            .createQueryBuilder('message')
            .innerJoinAndSelect('message.sender', 'sender')
            .innerJoinAndSelect('message.receiver', 'receiver')
            .innerJoin(`(${subQuery.getQuery()})`, 'last_msgs',
                '((message.senderId = :userId AND message.receiverId = last_msgs.partner_id) OR (message.receiverId = :userId AND message.senderId = last_msgs.partner_id)) AND message.createdAt = last_msgs.max_date')
            .setParameters({ userId, types: ['PRIVATE', 'IMAGE'] })
            .orderBy('message.createdAt', 'DESC')
            .getMany();

        // Filter out conversations with blocked users
        const blockedUsers = await this.blocksService.getBlockedUsers(userId);
        const blockedUserIds = new Set(blockedUsers.map(b => b.blocked.id));

        return inbox
            .filter(msg => {
                const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
                return !blockedUserIds.has(partnerId);
            })
            .map(msg => {
                const partner = msg.senderId === userId ? msg.receiver : msg.sender;
                return {
                    ...this.transformMessage(msg),
                    partner: {
                        id: partner?.id,
                        username: partner?.username || partner?.email?.split('@')[0],
                        profilePictureUrl: partner?.profilePictureUrl,
                        status: partner?.status
                    }
                };
            });
    }

    async getUserMessages(userId: string): Promise<Message[]> {
        return this.messageRepository.find({
            where: [
                { senderId: userId },
                { receiverId: userId }
            ],
            order: { createdAt: 'DESC' },
            relations: ['sender', 'receiver']
        });
    }
}
