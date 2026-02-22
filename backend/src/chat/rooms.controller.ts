import { Controller, Get, Post, Patch, Body, UseGuards, Delete, Param, Req, ForbiddenException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { PresenceService } from '../websocket/presence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';
import { ChatGateway } from './chat.gateway';

@Controller('rooms')
export class RoomsController {
    constructor(
        private roomsService: RoomsService,
        private auditLogService: AuditLogService,
        private chatGateway: ChatGateway,
        private presenceService: PresenceService,
    ) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getRooms() {
        const rooms = await this.roomsService.findAll();
        const roomsWithCounts = await Promise.all(rooms.map(async (room) => {
            const count = await this.presenceService.getRoomUserCount(room.id);
            return { ...room, onlineCount: count + 1 };
        }));
        return roomsWithCounts;
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getRoom(@Param('id') id: string) {
        const room = await this.roomsService.findOne(id);
        if (!room) return null;
        const count = await this.presenceService.getRoomUserCount(id);
        return { ...room, onlineCount: count + 1 };
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async createRoom(@Body() data: { roomName: string, roomDescription?: string, roomType?: string }, @Req() req: any) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Only admins are allowed to manage rooms'
            });
        }
        const room = await this.roomsService.create({
            roomName: data.roomName,
            roomDescription: data.roomDescription,
            roomType: data.roomType || 'PUBLIC',
            adminId: req.user.userId
        });

        await this.auditLogService.log({
            actionType: 'room_created',
            roomId: room.id,
            adminId: req.user.userId,
            ipAddress: req.ip,
            details: { roomName: room.roomName }
        });

        this.chatGateway.server.emit('room_created', room);
        return room;
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async updateRoom(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Only admins are allowed to manage rooms'
            });
        }
        // Filter allowed fields for update
        const updateData: any = {};
        if (data.roomName) updateData.roomName = data.roomName;
        if (data.roomDescription) updateData.roomDescription = data.roomDescription;
        if (data.roomType) updateData.roomType = data.roomType;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const room = await this.roomsService.update(id, updateData);

        await this.auditLogService.log({
            actionType: 'room_updated',
            roomId: id,
            adminId: req.user.userId,
            ipAddress: req.ip,
            details: updateData
        });

        this.chatGateway.server.emit('room_updated', room);
        return room;
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async deleteRoom(@Param('id') id: string, @Req() req: any) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Only admins are allowed to manage rooms'
            });
        }
        await this.roomsService.softDelete(id, req.user.userId);

        await this.auditLogService.log({
            actionType: 'room_deleted',
            roomId: id,
            adminId: req.user.userId,
            ipAddress: req.ip
        });

        // Disconnect all sockets from the room
        this.chatGateway.server.in(`room:${id}`).emit('room_deleted', { roomId: id });
        const sockets = await this.chatGateway.server.in(`room:${id}`).fetchSockets();
        sockets.forEach(s => s.leave(`room:${id}`));

        this.chatGateway.server.emit('room_deleted_global', { roomId: id });
        return { success: true };
    }
}
