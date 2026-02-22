import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
        private notificationsGateway: NotificationsGateway,
    ) { }

    async createNotification(user: User, type: string, content: string, relatedId?: string) {
        const notification = this.notificationsRepository.create({
            user,
            type,
            content,
            relatedId,
        });
        const savedNotification = await this.notificationsRepository.save(notification);

        // Emit real-time socket event
        this.notificationsGateway.sendNotification(user.id, savedNotification);

        return savedNotification;
    }

    async getNotifications(userId: string) {
        return this.notificationsRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }

    async markAsRead(notificationId: string) {
        await this.notificationsRepository.update(notificationId, { isRead: true });
    }
}
