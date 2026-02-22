import { Controller, Request, Post, UseGuards, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @ApiOperation({ summary: 'User login', description: 'Authenticate user with email and password' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Login successful, returns access and refresh tokens' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    async login(@Request() req: any, @Body() loginDto: LoginDto & { deviceId?: string; deviceType?: string }) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user, req.ip, loginDto.deviceId, loginDto.deviceType, loginDto.rememberMe);
    }

    @Post('register')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registrations per minute
    @ApiOperation({ summary: 'User registration', description: 'Register a new user account' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    async register(@Request() req: any, @Body() body: CreateUserDto & { deviceId?: string; deviceType?: string }) {
        return this.authService.register(body, req.ip, body.deviceId, body.deviceType);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiOperation({ summary: 'User logout', description: 'Logout user and invalidate refresh token' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async logout(@Request() req: any) {
        this.authService.logout(req.user.userId);
    }

    @UseGuards(RefreshGuard)
    @Post('refresh')
    @ApiOperation({ summary: 'Refresh tokens', description: 'Get new access token using refresh token' })
    @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshTokens(@Request() req: any) {
        const userId = req.user.sub;
        const refreshToken = req.user.refreshToken;
        return this.authService.refreshTokens(userId, refreshToken);
    }

    @Post('otp/generate')
    @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 OTP requests per 5 minutes
    @ApiOperation({ summary: 'Generate OTP', description: 'Generate and send OTP to user email for verification' })
    @ApiBody({ schema: { properties: { email: { type: 'string', format: 'email' } } } })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    @ApiResponse({ status: 400, description: 'Invalid email' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    async generateOtp(@Body('email') email: string) {
        return this.authService.generateOtp(email);
    }

    @Post('otp/verify')
    @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 verification attempts per 5 minutes
    @ApiOperation({ summary: 'Verify OTP', description: 'Verify OTP code and complete user registration' })
    @ApiBody({ schema: { properties: { email: { type: 'string' }, code: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'OTP verified successfully, user account activated' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    async verifyOtp(@Request() req: any, @Body() body: any) {
        return this.authService.verifyOtp(body.email, body.code, req.ip, body.deviceId, body.deviceType);
    }

    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 300000 } })
    @ApiOperation({ summary: 'Request password reset', description: 'Send OTP for password reset' })
    @ApiBody({ schema: { properties: { email: { type: 'string', format: 'email' } } } })
    async forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    @Throttle({ default: { limit: 5, ttl: 300000 } })
    @ApiOperation({ summary: 'Reset password', description: 'Reset password using OTP' })
    @ApiBody({ schema: { properties: { email: { type: 'string' }, code: { type: 'string' }, password: { type: 'string' } } } })
    async resetPassword(@Body() body: any) {
        return this.authService.resetPassword(body.email, body.code, body.password);
    }

    @Post('guest-login')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Guest login', description: 'Create a temporary guest account' })
    async guestLogin(@Request() req: any, @Body() body: { username?: string; age?: number; deviceId?: string; deviceType?: string }) {
        return this.authService.guestLogin(body.username, body.age, req.ip, body.deviceId, body.deviceType);
    }
}

