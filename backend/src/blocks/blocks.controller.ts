import { Controller, Post, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
    constructor(private readonly blocksService: BlocksService) { }

    @Post(':id')
    async blockUser(@Request() req, @Param('id') blockedId: string) {
        return this.blocksService.blockUser(req.user, blockedId);
    }

    @Get()
    async getBlockedUsers(@Request() req) {
        return this.blocksService.getBlockedUsers(req.user.userId);
    }

    @Delete(':id')
    async unblockUser(@Request() req, @Param('id') blockedId: string) {
        return this.blocksService.unblockUser(req.user.userId, blockedId);
    }
}
