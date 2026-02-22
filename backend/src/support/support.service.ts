import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportMessage } from './support-message.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
    constructor(
        @InjectRepository(SupportMessage)
        private supportRepository: Repository<SupportMessage>,
        private notificationsService: NotificationsService,
    ) { }

    async createMessage(user: User, subject: string, message: string) {
        const supportMessage = this.supportRepository.create({
            user,
            subject,
            message,
        });
        return this.supportRepository.save(supportMessage);
    }

    async replyToMessage(admin: User, messageId: string, reply: string) {
        const message = await this.supportRepository.findOne({
            where: { id: messageId },
            relations: ['user'],
        });
        if (!message) throw new Error('Message not found');

        message.reply = reply;
        message.repliedBy = admin;
        message.status = 'resolved';

        await this.supportRepository.save(message);

        // Notify the user
        await this.notificationsService.createNotification(
            message.user,
            'support',
            `Admin replied to your ticket: ${message.subject}`,
            message.id,
        );

        return message;
    }

    async getMyMessages(userId: string) {
        return this.supportRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }

    async getAllMessages() {
        return this.supportRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }
}
