import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    async getNotifications(@Request() req) {
        return this.notificationsService.getNotifications(req.user.userId);
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}
