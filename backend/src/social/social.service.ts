import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WallPost } from './entities/wall-post.entity';
import { Gift } from './entities/gift.entity';
import { UserGift } from './entities/user-gift.entity';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { BlocksService } from '../blocks/blocks.service';
import { PresenceService } from '../websocket/presence.service';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class SocialService implements OnModuleInit {
    constructor(
        @InjectRepository(WallPost)
        private wallPostRepository: Repository<WallPost>,
        @InjectRepository(Gift)
        private giftRepository: Repository<Gift>,
        @InjectRepository(UserGift)
        private userGiftRepository: Repository<UserGift>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Friendship)
        private friendshipRepository: Repository<Friendship>,
        private notificationsService: NotificationsService,
        @Inject(forwardRef(() => BlocksService))
        private blocksService: BlocksService,
        private presenceService: PresenceService,
    ) { }

    async onModuleInit() {
        // await this.seedGifts();
    }

    async createPost(userId: string, content: string, imageUrl?: string): Promise<WallPost> {
        const post = this.wallPostRepository.create({
            userId,
            content,
            imageUrl,
        });
        return this.wallPostRepository.save(post);
    }

    async getWallPosts(): Promise<WallPost[]> {
        return this.wallPostRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async deletePost(postId: string): Promise<void> {
        await this.wallPostRepository.delete(postId);
    }

    async likePost(postId: string): Promise<void> {
        await this.wallPostRepository.increment({ id: postId }, 'likesCount', 1);
    }

    async getAvailableGifts(): Promise<Gift[]> {
        return this.giftRepository.find();
    }

    async sendGift(senderId: string, receiverId: string, giftId: string, message?: string): Promise<UserGift> {
        const giftRecord = this.userGiftRepository.create({
            senderId,
            receiverId,
            giftId,
            message,
        });
        return this.userGiftRepository.save(giftRecord);
    }

    async getUserGifts(userId: string): Promise<UserGift[]> {
        return this.userGiftRepository.find({
            where: { receiverId: userId },
            relations: ['gift', 'sender'],
            order: { createdAt: 'DESC' },
        });
    }

    async seedGifts(): Promise<void> {
        const count = await this.giftRepository.count();
        if (count > 0) return;

        const initialGifts = [
            { name: 'Red Rose', icon: '🌹', price: 10, rarity: 'common' },
            { name: 'Diamond Ring', icon: '💍', price: 500, rarity: 'epic' },
            { name: 'Crown', icon: '👑', price: 1000, rarity: 'legendary' },
            { name: 'Heart', icon: '❤️', price: 5, rarity: 'common' },
            { name: 'Rocket', icon: '🚀', price: 200, rarity: 'rare' },
        ];

        await this.giftRepository.save(initialGifts);
    }

    async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
        if (requesterId === addresseeId) throw new Error('Cannot add yourself');

        // Check for Global Block
        const isBlocked = await this.blocksService.isBlocked(addresseeId, requesterId);
        if (isBlocked) throw new Error('You cannot send a friend request to this user.');

        const amIBlocked = await this.blocksService.isBlocked(requesterId, addresseeId);
        if (amIBlocked) throw new Error('Please unblock this user first.');

        // Check for existing relationship
        const existing = await this.friendshipRepository.findOne({
            where: [
                { requesterId, addresseeId },
                { requesterId: addresseeId, addresseeId: requesterId }
            ]
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') throw new Error('Already friends');
            if (existing.status === 'PENDING') throw new Error('Request already pending');
            if (existing.status === 'BLOCKED') throw new Error('User is blocked');
            // If REJECTED, we can allow a new request (or we could just update the status back to PENDING)
            existing.status = 'PENDING';
            existing.requesterId = requesterId;
            existing.addresseeId = addresseeId;
            return this.friendshipRepository.save(existing);
        }

        const friendship = this.friendshipRepository.create({
            requesterId,
            addresseeId,
            status: 'PENDING'
        });
        const saved = await this.friendshipRepository.save(friendship);

        // Notify addressee
        const requester = await this.userRepository.findOne({ where: { id: requesterId } });
        if (requester) {
            await this.notificationsService.createNotification(
                { id: addresseeId } as any,
                'friend_request',
                `${requester.username || requester.email} sent you a friend request`,
                requesterId
            );
        }

        return saved;
    }

    async acceptFriendRequest(userId: string, requesterId: string): Promise<void> {
        const friendship = await this.friendshipRepository.findOne({
            where: { requesterId, addresseeId: userId }
        });

        if (friendship) {
            friendship.status = 'ACCEPTED';
            await this.friendshipRepository.save(friendship);

            // Notify requester
            const addressee = await this.userRepository.findOne({ where: { id: userId } });
            await this.notificationsService.createNotification(
                { id: requesterId } as any,
                'friend_accepted',
                `${addressee?.username || 'Someone'} accepted your friend request`,
                userId
            );
        }
    }

    async rejectFriendRequest(userId: string, requesterId: string): Promise<void> {
        await this.friendshipRepository.update(
            { requesterId, addresseeId: userId },
            { status: 'REJECTED' }
        );
    }

    async removeFriendship(user1Id: string, user2Id: string): Promise<void> {
        await this.friendshipRepository.delete([
            { requesterId: user1Id, addresseeId: user2Id },
            { requesterId: user2Id, addresseeId: user1Id }
        ]);
    }

    async getFriends(userId: string): Promise<any[]> {
        const friendships = await this.friendshipRepository.find({
            where: [
                { requesterId: userId, status: 'ACCEPTED' },
                { addresseeId: userId, status: 'ACCEPTED' }
            ],
            relations: ['requester', 'addressee']
        });

        const friends = friendships.map(f => f.requesterId === userId ? f.addressee : f.requester);

        // Map with presence status
        return Promise.all(friends.map(async friend => {
            const status = await this.presenceService.getStatus(friend.id);
            return {
                ...friend,
                isOnline: status === 'online'
            };
        }));
    }

    async getPendingRequests(userId: string): Promise<Friendship[]> {
        return this.friendshipRepository.find({
            where: { addresseeId: userId, status: 'PENDING' },
            relations: ['requester']
        });
    }

    async establishMutualFriendship(user1Id: string, user2Id: string): Promise<void> {
        // Check if exists
        const existing = await this.friendshipRepository.findOne({
            where: [
                { requesterId: user1Id, addresseeId: user2Id },
                { requesterId: user2Id, addresseeId: user1Id }
            ]
        });

        if (existing) {
            existing.status = 'ACCEPTED';
            await this.friendshipRepository.save(existing);
            return;
        }

        const friendship = this.friendshipRepository.create({
            requesterId: user1Id,
            addresseeId: user2Id,
            status: 'ACCEPTED'
        });
        await this.friendshipRepository.save(friendship);
    }
}
