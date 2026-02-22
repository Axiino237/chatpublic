import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportMessage } from './support-message.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [TypeOrmModule.forFeature([SupportMessage]), NotificationsModule, AuthModule, UsersModule],
    providers: [SupportService],
    controllers: [SupportController],
    exports: [SupportService],
})
export class SupportModule { }
