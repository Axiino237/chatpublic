import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './block.entity';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { SocialModule } from '../social/social.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Block]),
        UsersModule,
        forwardRef(() => SocialModule)
    ],
    providers: [BlocksService],
    controllers: [BlocksController],
    exports: [BlocksService],
})
export class BlocksModule { }
