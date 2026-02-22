import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { BlocksModule } from './blocks/blocks.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
import { PresenceModule } from './websocket/presence.module';
import { SupportModule } from './support/support.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { ModerationModule } from './moderation/moderation.module';
import { RedisModule } from './redis/redis.module';
import { SocialModule } from './social/social.module';
import { ScheduleModule } from '@nestjs/schedule';

import { UserStatusGuard } from './auth/guards/user-status.guard';
import { SeedService } from './seed.service';

import { User } from './users/user.entity';
import { Message } from './chat/message.entity';
import { Ban } from './admin/ban.entity';
import { Block } from './blocks/block.entity';
import { Friendship } from './social/entities/friendship.entity';
import { WallPost } from './social/entities/wall-post.entity';
import { UserGift } from './social/entities/user-gift.entity';
import { Notification } from './notifications/notification.entity';
import { SupportMessage } from './support/support-message.entity';
import { Gift } from './social/entities/gift.entity';
import { Report } from './reports/report.entity';
import { Room } from './chat/room.entity';
import { AuditLog } from './chat/audit-log.entity';
import { SmtpSettings } from './mail/smtp-settings.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST') || '127.0.0.1',
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: process.env.DATABASE_NAME || 'lovelink_db',
        autoLoadEntities: false,
        synchronize: true,
        logging: true,
        entities: [
          User, Message, Ban, Block, Friendship, WallPost, UserGift,
          Notification, SupportMessage, Gift, Report, Room, AuditLog,
          SmtpSettings
        ],
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ChatModule,
    BlocksModule,
    ReportsModule,
    AdminModule,
    MediaModule,
    PresenceModule,
    SupportModule,
    NotificationsModule,
    AiModule,
    ModerationModule,
    RedisModule,
    SocialModule,
    ScheduleModule.forRoot(),
    // WinstonModule.forRoot(loggerOptions),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: UserStatusGuard,
    },
  ],
})
export class AppModule { }
