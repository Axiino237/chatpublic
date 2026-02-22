import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { WallPost } from './entities/wall-post.entity';
import { Gift } from './entities/gift.entity';
import { UserGift } from './entities/user-gift.entity';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BlocksModule } from '../blocks/blocks.module';
import { PresenceModule } from '../websocket/presence.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([WallPost, Gift, UserGift, Friendship, User]),
        UsersModule,
        NotificationsModule,
        forwardRef(() => BlocksModule),
        PresenceModule,
    ],
    providers: [SocialService],
    controllers: [SocialController],
    exports: [SocialService],
})
export class SocialModule { }
