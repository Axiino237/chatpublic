import { Module } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceGateway } from './presence.gateway';
import { LiveEventsGateway } from './live-events.gateway';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [RedisModule],
    providers: [PresenceService, PresenceGateway, LiveEventsGateway],
    exports: [PresenceService, LiveEventsGateway],
})
export class PresenceModule { }
