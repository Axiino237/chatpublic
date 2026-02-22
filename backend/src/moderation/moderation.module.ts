import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { PresenceModule } from '../websocket/presence.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [PresenceModule, NotificationsModule, UsersModule],
    providers: [ModerationService],
    exports: [ModerationService],
})
export class ModerationModule { }
