import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ban } from '../admin/ban.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        // private mailService: MailService,
        // @InjectRepository(Ban)
        // private bansRepository: Repository<Ban>,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, hashedRefreshToken, ...result } = user;
            return result;
        }
        return null;
    }

    async getTokens(userId: string, email: string, username?: string | null, rememberMe?: boolean, isGuest?: boolean) {
        const payload = { email, sub: userId, username: username || email.split('@')[0], isGuest: !!isGuest };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: rememberMe ? '30d' : '7d',
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }


    async updateRefreshToken(userId: string, refreshToken: string) {
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.usersService.update(userId, {
            hashedRefreshToken: hash,
        });
    }

    async login(user: any, ip?: string, deviceId?: string, deviceType?: string, rememberMe?: boolean) {
        // Disabled Ban check temporarily to isolate circular dependency
        /*
        if (ip || deviceId) {
            const activeBan = await this.bansRepository.findOne({
                where: [
                    { ipAddress: ip },
                    { deviceId: deviceId }
                ]
            });
            if (activeBan) {
                throw new UnauthorizedException(`Access Denied: Your ${activeBan.ipAddress === ip ? 'IP' : 'Device'} has been banned. Reason: ${activeBan.reason}`);
            }
        }
        */

        const tokens = await this.getTokens(user.id, user.email, user.username, rememberMe, user.isGuest);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        await this.usersService.update(user.id, {
            lastLoginIp: ip,
            lastLoginAt: new Date(),
            deviceId,
            deviceType
        });

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                gender: user.gender,
                interestedIn: user.interestedIn,
                location: user.location,
                profilePictureUrl: user.profilePictureUrl,
                role: user.role,
                points: user.points,
                badge: user.badge,
                isVerified: user.isVerified,
                status: user.status,
                dateOfBirth: user.dateOfBirth,
            }
        };
    }

    async register(createUserDto: CreateUserDto, ip?: string, deviceId?: string, deviceType?: string) {
        const existingUser = await this.usersService.findOneByEmail(createUserDto.email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Check if username already exists
        const existingUsername = await (this.usersService.usersRepository).findOne({ where: { username: createUserDto.username } });
        if (existingUsername) {
            throw new ConflictException('Username is already taken');
        }

        // Disabled Ban check
        /*
        if (ip || deviceId) {
             // ...
        }
        */

        const birthDate = new Date(createUserDto.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            throw new BadRequestException('You must be at least 18 years old to join.');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(createUserDto.password, salt);

        const newUser = await this.usersService.create({
            email: createUserDto.email,
            username: createUserDto.username,
            passwordHash,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            dateOfBirth: birthDate,
            gender: createUserDto.gender,
        });

        return this.login(newUser, ip, deviceId, deviceType);
    }


    async generateOtp(email: string) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await this.usersService.updateByEmail(email, { otpCode, otpExpiresAt });

        // Send OTP via email (MOCKED)
        /*
        try {
            await this.mailService.sendOtp(email, otpCode);
        } catch (error: any) {
            console.error('Error sending email:', error);
            throw new UnauthorizedException(`Failed to send verification email: ${error.message || 'Check SMTP settings'}`);
        }
        */
        console.log(`[MOCK] OTP for ${email}: ${otpCode}`);
        return { message: 'OTP sent successfully' };
    }

    async verifyOtp(email: string, code: string, ip?: string, deviceId?: string, deviceType?: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user || user.otpCode !== code || new Date() > user.otpExpiresAt!) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        const updatedUser = await this.usersService.update(user.id, {
            isVerified: true,
            otpCode: null,
            otpExpiresAt: null
        });

        return this.login(updatedUser, ip, deviceId, deviceType);
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findOneById(userId);
        if (!user || !user.hashedRefreshToken) {
            throw new UnauthorizedException('Access Denied');
        }

        const refreshTokenMatches = await bcrypt.compare(
            refreshToken,
            user.hashedRefreshToken,
        );
        if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');

        const tokens = await this.getTokens(user.id, user.email, user.username, undefined, user.isGuest);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }

    async logout(userId: string) {
        await this.usersService.update(userId, {
            hashedRefreshToken: null,
        });
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            // Silently fail to prevent email enumeration, but log it
            console.log(`Forgot password requested for non - existent email: ${email} `);
            return { message: 'If an account exists with this email, an OTP has been sent.' };
        }
        return this.generateOtp(email);
    }

    async resetPassword(email: string, code: string, pass: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user || user.otpCode !== code || new Date() > user.otpExpiresAt!) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(pass, salt);

        await this.usersService.update(user.id, {
            passwordHash,
            isVerified: true,
            otpCode: null,
            otpExpiresAt: null,
            hashedRefreshToken: null
        });

        return { message: 'Password reset successful. Please login with your new password.' };
    }

    async guestLogin(username?: string, age?: number, ip?: string, deviceId?: string, deviceType?: string) {
        if (age && age < 18) {
            throw new BadRequestException('You must be at least 18 years old to join.');
        }

        if (username) {
            const existing = await this.usersService.findOneByUsernameCaseInsensitive(username);
            if (existing) throw new ConflictException('Username is already taken');
        }

        const guestId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const guestEmail = `guest_${guestId}@temporary.chat`;
        const guestUsername = username || `Guest_${guestId}`;

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(Math.random().toString(36), salt);

        const guestUser = await this.usersService.create({
            email: guestEmail,
            username: guestUsername,
            passwordHash,
            firstName: 'Guest',
            lastName: guestId,
            role: 'guest'
        });

        if (age) {
            // Store age or just use it for validation. Entity doesn't have age field, using dateOfBirth placeholder
            const dob = new Date();
            dob.setFullYear(dob.getFullYear() - age);
            await this.usersService.update(guestUser.id, { dateOfBirth: dob });
        }

        await this.usersService.update(guestUser.id, { isGuest: true });

        const tokens = await this.getTokens(guestUser.id, guestEmail, guestUsername, undefined, true);
        await this.updateRefreshToken(guestUser.id, tokens.refreshToken);

        await this.usersService.update(guestUser.id, {
            lastLoginIp: ip,
            lastLoginAt: new Date(),
            deviceId,
            deviceType
        });

        return {
            ...tokens,
            user: {
                id: guestUser.id,
                email: guestEmail,
                username: guestUsername,
                role: 'guest', // Return correct role
                isGuest: true,
                badge: 'Guest'
            }
        };
    }
}
