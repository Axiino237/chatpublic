import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { UsersModule } from '../users/users.module';

@Module({
    providers: [MediaService],
    controllers: [MediaController],
    imports: [UsersModule],
})
export class MediaModule { }
