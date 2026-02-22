import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class MediaService {
    async uploadProfilePicture(user: User, fileName: string): Promise<string> {
        // In a real S3 implementation, this would return the bucket URL
        // For now, returning a local path placeholder
        const profilePictureUrl = `/uploads/profiles/${fileName}`;

        // Update user's profile picture URL
        // We assume the user service handles the actual update
        return profilePictureUrl;
    }
}
