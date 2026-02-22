import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { Room } from './room.entity';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { GamificationService } from './gamification.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';
import { PresenceModule } from '../websocket/presence.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatController } from './chat.controller';
import { BlocksModule } from '../blocks/blocks.module';
import { AuditLog } from './audit-log.entity';
import { AuditLogService } from './audit-log.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message, Room, AuditLog]),
        UsersModule,
        AuthModule,
        ModerationModule,
        PresenceModule,
        NotificationsModule,
        BlocksModule
    ],
    providers: [ChatGateway, ChatService, RoomsService, GamificationService, AuditLogService],
    controllers: [RoomsController, ChatController],
    exports: [ChatService, RoomsService, GamificationService, AuditLogService],
})
export class ChatModule { }
