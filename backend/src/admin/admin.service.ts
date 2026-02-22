import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { AdminSettings } from './admin-settings.entity';
import { PresenceService } from '../websocket/presence.service';
import { Ban } from './ban.entity';
import { SmtpSettings } from '../mail/smtp-settings.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(AdminSettings)
        private settingsRepository: Repository<AdminSettings>,
        @InjectRepository(Ban)
        private bansRepository: Repository<Ban>,
        @InjectRepository(SmtpSettings)
        private smtpRepository: Repository<SmtpSettings>,
        private presenceService: PresenceService,
    ) { }

    async getAllUsers(): Promise<User[]> {
        const users = await this.usersRepository.find({
            order: { createdAt: 'DESC' }
        });

        try {
            const onlineIds = await this.presenceService.getActiveUserIds();
            const onlineSet = new Set(onlineIds);

            // Inject presence and sort
            return users
                .map(u => ({ ...u, isOnline: onlineSet.has(u.id) }))
                .sort((a, b) => {
                    // 1. Online First
                    if (a.isOnline && !b.isOnline) return -1;
                    if (!a.isOnline && b.isOnline) return 1;
                    // 2. Real Users before Bots (if needed, or just by created at)
                    return 0;
                }) as User[];
        } catch (e) {
            console.error('Failed to fetch presence for sorting', e);
            return users;
        }
    }

    async getUserWithStats(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async suspendUser(userId: string): Promise<void> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (user) {
            await this.usersRepository.update(userId, { isSuspended: !user.isSuspended });
        }
    }

    async banUser(userId: string, adminId: string, reason: string): Promise<Ban> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const ban = this.bansRepository.create({
            userId,
            bannedById: adminId,
            reason,
            ipAddress: user.lastLoginIp,
            deviceId: user.deviceId,
        });

        await this.bansRepository.save(ban);
        await this.usersRepository.update(userId, { status: 'banned', isSuspended: true });

        // TODO: Disconnect socket (will handle in Gateway or Presence service)
        return ban;
    }

    async unbanUser(userId: string): Promise<void> {
        await this.usersRepository.update(userId, { status: 'active', isSuspended: false });
        // We might want to mark the Ban record as inactive or just keep history
    }

    async verifyUser(userId: string): Promise<void> {
        await this.usersRepository.update(userId, { isVerified: true });
    }

    async getSettings(): Promise<AdminSettings> {
        let settings = await this.settingsRepository.findOne({ where: { id: 1 } });
        if (!settings) {
            settings = this.settingsRepository.create({ id: 1 });
            await this.settingsRepository.save(settings);
        }
        return settings;
    }

    async updateSettings(updateData: Partial<AdminSettings>): Promise<AdminSettings> {
        await this.settingsRepository.update(1, updateData);
        return this.getSettings();
    }

    async getSmtpSettings(): Promise<SmtpSettings> {
        let settings = await this.smtpRepository.findOne({ where: { id: 1 } });
        if (!settings) {
            settings = this.smtpRepository.create({ id: 1 });
            await this.smtpRepository.save(settings);
        }
        return settings;
    }

    async updateSmtpSettings(updateData: Partial<SmtpSettings>): Promise<SmtpSettings> {
        await this.smtpRepository.update(1, updateData);
        return this.getSmtpSettings();
    }
}
