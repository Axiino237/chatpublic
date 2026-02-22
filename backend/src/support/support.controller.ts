import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
    constructor(private supportService: SupportService) { }

    @Post()
    async createMessage(@Request() req, @Body() body: { subject: string; message: string }) {
        return this.supportService.createMessage(req.user, body.subject, body.message);
    }

    @Get('my')
    async getMyMessages(@Request() req) {
        return this.supportService.getMyMessages(req.user.userId);
    }

    @Get('all')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async getAllMessages() {
        return this.supportService.getAllMessages();
    }

    @Post('reply/:id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async replyToMessage(@Request() req, @Param('id') messageId: string, @Body('reply') reply: string) {
        return this.supportService.replyToMessage(req.user, messageId, reply);
    }
}
