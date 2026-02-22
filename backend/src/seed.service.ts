import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoomsService } from './chat/rooms.service';
import { AdminService } from './admin/admin.service';
import { UsersService } from './users/users.service';
import { SocialService } from './social/social.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        private roomsService: RoomsService,
        private adminService: AdminService,
        private usersService: UsersService,
        private socialService: SocialService,
    ) { }

    async onModuleInit() {
        console.log('🌱 Starting Database Seeding...');

        // 0. Seed Gifts
        try {
            await this.socialService.seedGifts();
        } catch (e) {
            console.warn('Seed Gifts Error (Ignored):', e);
        }

        // 1. Seed Rooms
        const rooms = await this.roomsService.findAll();
        if (rooms.length === 0) {
            console.log('🏠 Seeding Rooms...');
            const seedRooms = [
                { roomName: 'Global Lobby', roomDescription: 'Connect with everyone worldwide', roomType: 'PUBLIC' },
                { roomName: 'Japanese Culture', roomDescription: 'Discuss Japanese culture, anime, and travel', roomType: 'PUBLIC' },
                { roomName: 'European Travel', roomDescription: 'Tips and chat about traveling in Europe', roomType: 'PUBLIC' },
                { roomName: 'Language Exchange', roomDescription: 'Practice new languages with native speakers', roomType: 'PUBLIC' }
            ];

            for (const r of seedRooms) {
                await this.roomsService.create({ ...r, adminId: 'SYSTEM' });
            }
        }

        // 2. Seed Admin Settings
        const settings = await this.adminService.getSettings();
        if (!settings) {
            console.log('⚙️ Seeding Admin Settings...');
            await this.adminService.updateSettings({
                sessionControlEnabled: true,
                passwordExpiryEnabled: false
            });
        }

        // 3. Seed Default Admin User (if none exists)
        const adminEmail = 'admin@lovelink.com';
        const existingAdmin = await this.usersService.findOneByEmail(adminEmail);
        if (!existingAdmin) {
            console.log('👤 Seeding Default Admin...');
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash('Admin@123', salt);
            const admin = await this.usersService.create({
                email: adminEmail,
                username: 'admin',
                passwordHash,
                firstName: 'System',
                lastName: 'Admin',
                dateOfBirth: new Date('1990-01-01'),
            });

            await this.usersService.update(admin.id, { role: 'admin', isVerified: true });
        }

        console.log('✅ Seeding Completed.');
    }
}
