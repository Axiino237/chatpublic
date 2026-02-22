import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        public usersRepository: Repository<User>,
    ) { }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findOneById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findOneByUsernameCaseInsensitive(username: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { username: ILike(username) }
        });
    }

    async create(data: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(data);
        return this.usersRepository.save(user);
    }

    async update(id: string, data: Partial<User>): Promise<User | null> {
        await this.usersRepository.update(id, data);
        return this.findOneById(id);
    }

    async updateByEmail(email: string, data: Partial<User>): Promise<void> {
        await this.usersRepository.update({ email }, data);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async updateProfile(userId: string, data: any): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'username', 'firstName', 'lastName', 'bio', 'gender', 'nationality', 'languages', 'role', 'status']
        });
        if (!user) throw new NotFoundException('User not found');

        // If username is being updated, check if it's already taken by another user
        if (data.username && data.username !== user.username) {
            const existingUser = await this.usersRepository.findOne({
                where: { username: ILike(data.username) }
            });
            if (existingUser && existingUser.id !== userId) {
                throw new ConflictException('Username is already taken');
            }
        }

        // Clean values: remove any keys that shouldn't be updated or are invalid
        const allowedFields = [
            'username', 'firstName', 'lastName', 'bio', 'gender',
            'interestedIn', 'dateOfBirth', 'location', 'nationality',
            'languages', 'travelBucketList', 'culturalInterests'
        ];

        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {

                if (key === 'dateOfBirth' && data[key]) {
                    user.dateOfBirth = new Date(data[key]);
                } else {
                    user[key] = data[key];
                }
            }
        });


        try {
            const savedUser = await this.usersRepository.save(user);

            return savedUser;
        } catch (error) {
            console.error(`❌ [UsersService] Database save error:`, error);
            if (error.code === '23505') { // Postgres unique violation code
                throw new ConflictException('Identity already exists (Username or Email taken)');
            }
            throw new BadRequestException('Failed to update profile: ' + error.message);
        }
    }

    async getPublicProfile(id: string): Promise<any> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) return null;
        return {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio,
            profilePictureUrl: user.profilePictureUrl,
            role: user.role,
            status: user.status,
            badge: user.badge,
            nationality: user.nationality,
            languages: user.languages,
            travelBucketList: user.travelBucketList,
            culturalInterests: user.culturalInterests
        };
    }
}
