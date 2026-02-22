import { Controller, Get, Post, Body, UseGuards, Request, Delete, Param, Patch } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
    constructor(private readonly socialService: SocialService) { }

    @Post('post')
    async createPost(@Request() req, @Body() body: { content: string, imageUrl?: string }) {
        return this.socialService.createPost(req.user.id, body.content, body.imageUrl);
    }

    @Get('wall')
    async getWall() {
        return this.socialService.getWallPosts();
    }

    @Patch('post/:id/like')
    async likePost(@Param('id') id: string) {
        return this.socialService.likePost(id);
    }

    @Delete('post/:id')
    @UseGuards(RolesGuard)
    @Roles('admin', 'monitor')
    async deletePost(@Param('id') id: string) {
        return this.socialService.deletePost(id);
    }

    @Get('gifts')
    async getGifts() {
        return this.socialService.getAvailableGifts();
    }

    @Post('gift/send')
    async sendGift(@Request() req, @Body() body: { receiverId: string, giftId: string, message?: string }) {
        return this.socialService.sendGift(req.user.id, body.receiverId, body.giftId, body.message);
    }

    @Get('gifts/:userId')
    async getUserGifts(@Param('userId') userId: string) {
        return this.socialService.getUserGifts(userId);
    }

    @Get('friends')
    async getFriends(@Request() req) {
        return this.socialService.getFriends(req.user.id);
    }

    @Get('friends/pending')
    async getPendingRequests(@Request() req) {
        return this.socialService.getPendingRequests(req.user.id);
    }

    @Post('friend/request')
    async sendFriendRequest(@Request() req, @Body() body: { addresseeId: string }) {
        return this.socialService.sendFriendRequest(req.user.id, body.addresseeId);
    }

    @Patch('friend/accept')
    async acceptFriendRequest(@Request() req, @Body() body: { requesterId: string }) {
        return this.socialService.acceptFriendRequest(req.user.id, body.requesterId);
    }

    @Patch('friend/reject')
    async rejectFriendRequest(@Request() req, @Body() body: { requesterId: string }) {
        return this.socialService.rejectFriendRequest(req.user.id, body.requesterId);
    }
}
