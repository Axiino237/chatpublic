import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(
        private aiService: AiService,
        private usersService: UsersService,
    ) { }

    @Post('icebreaker')
    async getIcebreaker(@Request() req, @Body('targetId') targetId: string) {
        const user = await this.usersService.findOneById(req.user.userId);
        const target = await this.usersService.findOneById(targetId);
        if (!user || !target) throw new Error('User not found');

        return this.aiService.generateIcebreaker(user, target);
    }

    @Get('compatibility/:targetId')
    async getCompatibility(@Request() req, @Param('targetId') targetId: string) {
        const user = await this.usersService.findOneById(req.user.userId);
        const target = await this.usersService.findOneById(targetId);
        if (!user || !target) throw new Error('User not found');

        return this.aiService.calculateCompatibility(user, target);
    }
}
