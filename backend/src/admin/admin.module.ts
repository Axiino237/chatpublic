import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MonitorController } from './monitor.controller';
import { AdminSettings } from './admin-settings.entity';
import { User } from '../users/user.entity';
import { PresenceModule } from '../websocket/presence.module';
import { ChatModule } from '../chat/chat.module';
import { UsersModule } from '../users/users.module';

import { Ban } from './ban.entity';
import { SmtpSettings } from '../mail/smtp-settings.entity';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, AdminSettings, Ban, SmtpSettings]),
        PresenceModule,
        ChatModule,
        UsersModule,
        MailModule
    ],
    providers: [AdminService],
    controllers: [AdminController, MonitorController],
    exports: [AdminService],
})
export class AdminModule { }
