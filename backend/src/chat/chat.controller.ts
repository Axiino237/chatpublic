import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('room/:roomId/messages')
    async getRoomMessages(@Req() req, @Param('roomId') roomId: string) {
        return this.chatService.getRoomMessages(roomId, req.user.id);
    }

    @Get('private/messages/:otherUserId')
    async getPrivateMessages(@Req() req, @Param('otherUserId') otherUserId: string) {
        return this.chatService.getPrivateMessages(req.user.id, otherUserId);
    }

    @Get('inbox')
    async getInbox(@Req() req) {
        return this.chatService.getInbox(req.user.id);
    }
}
