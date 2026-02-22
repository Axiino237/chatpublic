import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private roomsRepository: Repository<Room>,
    ) { }

    async create(data: { roomName: string, roomDescription?: string, roomType: string, adminId: string }): Promise<Room> {
        const room = this.roomsRepository.create({
            roomName: data.roomName,
            roomDescription: data.roomDescription,
            roomType: data.roomType,
            createdBy: data.adminId,
            isActive: true,
            isDeleted: false
        });
        return this.roomsRepository.save(room);
    }

    async findAll(): Promise<Room[]> {
        const rooms = await this.roomsRepository.find({ where: { isActive: true, isDeleted: false } });
        return rooms.map(r => ({ ...r, roomName: r.roomName || `Exploration Zone ${r.id.slice(0, 4)}` }));
    }

    async findOne(id: string): Promise<Room | undefined> {
        const room = await this.roomsRepository.findOne({ where: { id, isDeleted: false } });
        if (room && !room.roomName) {
            room.roomName = `Exploration Zone ${room.id.slice(0, 4)}`;
        }
        return room || undefined;
    }

    async update(id: string, data: Partial<Room>): Promise<Room> {
        await this.roomsRepository.update(id, data);
        return this.findOne(id) as any;
    }

    async softDelete(id: string, adminId: string): Promise<void> {
        await this.roomsRepository.update(id, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: adminId,
            isActive: false
        });
    }

    async delete(id: string): Promise<void> {
        // Keeping this for compatibility but redirecting to softDelete
        await this.roomsRepository.update(id, { isDeleted: true, deletedAt: new Date() });
    }
}
