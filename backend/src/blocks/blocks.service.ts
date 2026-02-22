import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './block.entity';
import { User } from '../users/user.entity';
import { forwardRef, Inject } from '@nestjs/common';
import { SocialService } from '../social/social.service';

@Injectable()
export class BlocksService {
    constructor(
        @InjectRepository(Block)
        private blocksRepository: Repository<Block>,
        @Inject(forwardRef(() => SocialService))
        private socialService: SocialService,
    ) { }

    async blockUser(blocker: User, blockedId: string): Promise<Block> {
        if (blocker.id === blockedId) {
            throw new BadRequestException('You cannot block yourself');
        }

        const block = this.blocksRepository.create({
            blocker,
            blocked: { id: blockedId } as User,
        });

        const savedBlock = await this.blocksRepository.save(block);

        // Cleanup any existing friendship
        await this.socialService.removeFriendship(blocker.id, blockedId);

        return savedBlock;
    }

    async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
        const block = await this.blocksRepository.findOne({
            where: { blocker: { id: blockerId }, blocked: { id: blockedId } },
        });
        return !!block;
    }

    async getBlockedUsers(userId: string): Promise<Block[]> {
        return this.blocksRepository.find({
            where: { blocker: { id: userId } },
            relations: ['blocked'],
        });
    }

    async unblockUser(blockerId: string, blockedId: string): Promise<void> {
        await this.blocksRepository.delete({
            blocker: { id: blockerId },
            blocked: { id: blockedId },
        });
    }
}
