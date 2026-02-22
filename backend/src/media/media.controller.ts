import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Request, Logger } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path = require('path');
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@ApiTags('media')
@ApiBearerAuth('JWT-auth')
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
    private readonly logger = new Logger(MediaController.name);
    constructor(
        private readonly mediaService: MediaService,
        private readonly usersService: UsersService,
    ) { }


    @Post('upload/profile-picture')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/profiles',
            filename: (req, file, cb) => {
                const randomName = uuidv4();
                const extension = path.parse(file.originalname).ext || '.png';
                cb(null, `${randomName}${extension}`);
            }
        })
    }))
    @ApiOperation({ summary: 'Upload profile picture', description: 'Upload a new profile picture for the current user' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded successfully, returns the URL' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async uploadFile(@UploadedFile() file, @Request() req) {
        if (!file) {
            this.logger.error(`❌ No file provided in upload request for user ${req.user.userId}`);
            throw new Error('No file uploaded');
        }

        this.logger.log(`📥 [MediaController] Uploading profile picture for user ${req.user.userId}: ${file.filename}`);
        try {
            const filePath = await this.mediaService.uploadProfilePicture(req.user, file.filename);
            this.logger.log(`💾 [MediaController] Generated filePath: ${filePath}`);

            await this.usersService.update(req.user.userId, { profilePictureUrl: filePath });
            this.logger.log(`✅ [MediaController] DB updated with profilePictureUrl for user ${req.user.userId}: ${filePath}`);

            return { url: filePath };
        } catch (error) {
            this.logger.error(`❌ [MediaController] Failed to update profile picture: ${error.message}`, error.stack);
            throw error;
        }
    }

    @Post('upload/chat-attachment')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/attachments',
            filename: (req, file, cb) => {
                const randomName = uuidv4();
                const extension = path.parse(file.originalname).ext || '.png';
                cb(null, `${randomName}${extension}`);
            }
        }),
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    }))
    @ApiOperation({ summary: 'Upload chat attachment', description: 'Upload an image or GIF for chat' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded successfully, returns the URL' })
    async uploadChatAttachment(@UploadedFile() file) {
        if (!file) {
            this.logger.error(`❌ No file provided in chat attachment upload`);
            throw new Error('No file uploaded');
        }

        const filePath = `/uploads/attachments/${file.filename}`;
        this.logger.log(`📥 Uploaded chat attachment: ${filePath}`);
        return { url: filePath, type: file.mimetype.startsWith('image/') ? 'image' : 'file' };
    }
}

