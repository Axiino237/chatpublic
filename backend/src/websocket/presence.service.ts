import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PresenceService {
    constructor(private redisService: RedisService) { }

    async setOnline(userId: string) {
        await this.redisService.set(`presence:${userId}`, 'online', 'EX', 60); // 60s TTL
    }

    async setOffline(userId: string) {
        await this.redisService.del(`presence:${userId}`);
    }

    async getStatus(userId: string): Promise<string> {
        const status = await this.redisService.get(`presence:${userId}`);
        return status || 'offline';
    }

    async muteUser(userId: string, seconds: number) {
        await this.redisService.set(`mute:${userId}`, 'true', 'EX', seconds);
    }

    async isMuted(userId: string): Promise<boolean> {
        const muted = await this.redisService.get(`mute:${userId}`);
        return !!muted;
    }

    async unmuteUser(userId: string) {
        await this.redisService.del(`mute:${userId}`);
    }

    async setTyping(userId: string, roomId: string) {
        await this.redisService.set(`typing:${roomId}:${userId}`, 'true', 'EX', 5); // 5s TTL
    }

    async isTyping(userId: string, roomId: string): Promise<boolean> {
        const typing = await this.redisService.get(`typing:${roomId}:${userId}`);
        return !!typing;
    }

    async addRoomUser(roomId: string, userId: string) {
        // Track user in room
        await this.redisService.getClient().sadd(`room:active:${roomId}`, userId);
        // Track room in user's active list (for disconnect cleanup)
        await this.redisService.getClient().sadd(`user:rooms:${userId}`, roomId);
    }

    async removeRoomUser(roomId: string, userId: string) {
        await this.redisService.getClient().srem(`room:active:${roomId}`, userId);
        await this.redisService.getClient().srem(`user:rooms:${userId}`, roomId);
    }

    async getUserRooms(userId: string): Promise<string[]> {
        return this.redisService.getClient().smembers(`user:rooms:${userId}`);
    }

    async clearUserRooms(userId: string) {
        await this.redisService.getClient().del(`user:rooms:${userId}`);
    }

    async getRoomUserIds(roomId: string): Promise<string[]> {
        return this.redisService.getClient().smembers(`room:active:${roomId}`);
    }

    async getRoomUserCount(roomId: string): Promise<number> {
        return this.redisService.getClient().scard(`room:active:${roomId}`);
    }

    async getActiveUserIds(): Promise<string[]> {
        const keys = await this.redisService.getClient().keys('presence:*');
        return keys.map(key => key.split(':')[1]);
    }
}
