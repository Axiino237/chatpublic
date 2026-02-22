import { Injectable } from '@nestjs/common';
import { PresenceService } from '../websocket/presence.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class ModerationService {
    private badWords = [
        // Serious Harassment/Slurs (Keep these blocked)
        'offensive_slur1', 'offensive_slur2',
        // Harmful/Illegal (Keep these blocked)
        'child_abuse_content_trigger', 'terrorism_trigger',
        // Spam
        'free_crypto', 'get_rich_quick_scam'
    ];
    private readonly MAX_REPEATED_MESSAGES = 5;
    private auditLogService: any;

    constructor(
        private presenceService: PresenceService,
        private notificationsService: NotificationsService,
        private usersService: UsersService,
        private redisService: RedisService,
    ) { }

    // Manual injection or setter to avoid circular deps with ChatModule/ModerationModule if any
    setAuditLogService(service: any) {
        this.auditLogService = service;
    }

    containsProfanity(text: string): boolean {
        const lowerText = text.toLowerCase();
        return this.badWords.some(word => lowerText.includes(word));
    }

    containsLinksOrSocials(text: string): boolean {
        // Spec: Detect any external website links (http, https, www)
        const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-zA-Z]{5,}\.[a-zA-Z]{2,})/gi;

        // Spec: Detect social media IDs or handles (Insta, FB, WA, TG, X, Snap)
        const socialPlatforms = [
            'instagram', 'insta', 'facebook', 'fb',
            'whatsapp', 'wa.me', 'telegram', 't.me',
            'twitter', 'x.com', 'snapchat', 'snap'
        ];
        const socialPattern = new RegExp(`(${socialPlatforms.join('|')})`, 'gi');

        return urlPattern.test(text) || socialPattern.test(text);
    }

    async checkSpam(userId: string, text: string): Promise<boolean> {
        if (userId === 'SYSTEM_AI') return false;
        const contentKey = Buffer.from(text).toString('base64').substring(0, 100);
        const key = `spam:${userId}:${contentKey}`;
        const redis = this.redisService.getClient();
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, 60);
        return count >= this.MAX_REPEATED_MESSAGES;
    }

    async handleViolation(userId: string, reason: string = 'Sharing external links or social media IDs', durationMinutes: number = 24 * 60) {
        const user = await this.usersService.findOneById(userId);
        if (!user) return;

        const mutedUntil = new Date();
        mutedUntil.setMinutes(mutedUntil.getMinutes() + durationMinutes);

        await this.usersService.update(userId, {
            mutedUntil,
            status: 'muted'
        });

        await this.presenceService.muteUser(userId, durationMinutes * 60);

        // Notify user via system notification
        const durationText = durationMinutes >= 60 ? `${Math.round(durationMinutes / 60)} hours` : `${durationMinutes} minutes`;
        await this.notificationsService.createNotification(
            user,
            'system',
            `🔇 You are muted for ${durationText} due to policy violation: ${reason}.`,
        );

        // Log the AI action
        if (this.auditLogService) {
            await this.auditLogService.log({
                actionType: 'user_muted',
                adminId: 'SYSTEM_AI',
                roomId: 'GLOBAL',
                reason: reason,
                details: { userId, duration: durationText }
            });
        }
    }

    async checkMuteStatus(userId: string): Promise<boolean> {
        const user = await this.usersService.findOneById(userId);
        if (!user || !user.mutedUntil) return false;

        const now = new Date();
        if (now > user.mutedUntil) {
            // Auto unmute logic: if time passed, clear it
            await this.usersService.update(userId, { mutedUntil: null, status: 'active' });
            await this.presenceService.unmuteUser(userId);
            return false;
        }
        return true;
    }
}
