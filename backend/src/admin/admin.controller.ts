import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LiveEventsGateway } from '../websocket/live-events.gateway';
import { Post, Param } from '@nestjs/common';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly liveEventsGateway: LiveEventsGateway,
    ) { }

    @Get('users')
    async getUsers() {
        return this.adminService.getAllUsers();
    }

    @Patch('users/ban')
    async banUser(@Body() body: { userId: string; reason: string }, @Request() req) {
        return this.adminService.banUser(body.userId, req.user.id, body.reason);
    }

    @Patch('users/unban')
    async unbanUser(@Body() body: { userId: string }) {
        return this.adminService.unbanUser(body.userId);
    }

    @Get('settings')
    async getSettings() {
        return this.adminService.getSettings();
    }

    @Patch('settings')
    async updateSettings(@Body() updateData: any) {
        return this.adminService.updateSettings(updateData);
    }

    @Get('smtp-settings')
    async getSmtpSettings() {
        return this.adminService.getSmtpSettings();
    }

    @Patch('smtp-settings')
    async updateSmtpSettings(@Body() updateData: any) {
        return this.adminService.updateSmtpSettings(updateData);
    }

    @Post('announce')
    async announce(@Body() body: { message: string }, @Request() req) {
        this.liveEventsGateway.sendGlobalAnnouncement(body.message, req.user.firstName);
        return { success: true };
    }

    @Patch('users/:id/verify')
    async verifyUser(@Param('id') id: string) {
        return this.adminService.verifyUser(id);
    }
}
