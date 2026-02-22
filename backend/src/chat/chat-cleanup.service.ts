import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from './message.entity';
import { subHours } from 'date-fns';

@Injectable()
export class ChatCleanupService {
    private readonly logger = new Logger(ChatCleanupService.name);

    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleCron() {
        this.logger.log('Starting chat messages cleanup task...');

        const twentyFourHoursAgo = subHours(new Date(), 24);

        try {
            const result = await this.messageRepository.delete({
                createdAt: LessThan(twentyFourHoursAgo),
            });

            this.logger.log(`Cleanup complete. Deleted ${result.affected || 0} messages older than 24 hours.`);
        } catch (error) {
            this.logger.error('Error during chat messages cleanup:', error);
        }
    }
}
