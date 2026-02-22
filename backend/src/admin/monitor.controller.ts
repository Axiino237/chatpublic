import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('monitor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'monitor')
export class MonitorController {
    constructor(
        private chatService: ChatService,
        private adminService: AdminService
    ) { }

    @Get('activity')
    async getActivity() {
        return this.chatService.getAllMessages();
    }

    @Get('kick/:userId')
    async kickUser(@Param('userId') userId: string) {
        return this.adminService.suspendUser(userId);
    }

    @Get('user/:id')
    async getUserDetails(@Param('id') id: string) {
        return this.adminService.getUserWithStats(id);
    }

    @Get('user/:id/chats')
    async getChatHistory(@Param('id') id: string) {
        return this.chatService.getUserMessages(id);
    }
}
