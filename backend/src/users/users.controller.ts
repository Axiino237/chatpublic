import { Controller, Get, Param, UseGuards, Patch, Body, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(private readonly usersService: UsersService) { }


    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile', description: 'Returns the profile of the currently authenticated user' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getMe(@Request() req) {
        this.logger.log(`🔍 [UsersController] getMe for user ID: ${req.user.userId}`);
        return this.usersService.findOneById(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile (alias for /me)', description: 'Returns the profile of the currently authenticated user' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@Request() req) {
        this.logger.log(`🔍 [UsersController] getProfile for user ID: ${req.user.userId}`);
        try {
            const user = await this.usersService.findOneById(req.user.userId);
            if (!user) {
                this.logger.warn(`⚠️ [UsersController] Profile NOT FOUND for user ID: ${req.user.userId}`);
                return null;
            }
            this.logger.log(`✅ [UsersController] Profile found for user: ${user.username || user.email}`);
            return user;
        } catch (error) {
            this.logger.error(`❌ [UsersController] Error in getProfile: ${error.message}`, error.stack);
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    @ApiOperation({ summary: 'Update user profile', description: 'Updates the profile of the currently authenticated user' })
    @ApiResponse({ status: 200, description: 'User profile updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        this.logger.log(`📥 [UsersController] Incoming profile update for user ${req.user.userId}`);
        this.logger.log(`📦 [UsersController] Payload: ${JSON.stringify(updateProfileDto)}`);
        try {
            const result = await this.usersService.updateProfile(req.user.userId, updateProfileDto);
            this.logger.log(`✅ [UsersController] Profile updated successfully for user ${req.user.userId}`);
            return result;
        } catch (error) {
            this.logger.error(`❌ [UsersController] Failed to update profile for user ${req.user.userId}: ${error.message}`);
            this.logger.error(`🚨 [UsersController] Error stack: ${error.stack}`);
            throw error;
        }
    }


    @Get('id/:id')
    @ApiOperation({ summary: 'Find user by ID', description: 'Returns user details by their unique ID' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findById(@Param('id') id: string) {
        this.logger.log(`🔍 [UsersController] findById for ID: ${id}`);
        return this.usersService.findOneById(id);
    }

    @Get('profile/:id')
    @ApiOperation({ summary: 'Get public user profile', description: 'Returns basic public details of a user' })
    @ApiResponse({ status: 200, description: 'Profile retrieved' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getPublicProfile(@Param('id') id: string) {
        const profile = await this.usersService.getPublicProfile(id);
        if (!profile) return null;
        return profile;
    }

    @Get(':email')
    @ApiOperation({ summary: 'Find user by email', description: 'Returns user details by their email address' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findOne(@Param('email') email: string) {
        return this.usersService.findOneByEmail(email);
    }
}

