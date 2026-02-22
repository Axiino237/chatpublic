import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ban } from '../admin/ban.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { UserStatusGuard } from './guards/user-status.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    // MailModule,
    // PassportModule,
    // TypeOrmModule.forFeature([Ban]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION_TIME') as any },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, JwtAuthGuard, RefreshGuard, UserStatusGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, JwtAuthGuard, RefreshGuard, UserStatusGuard, RolesGuard],
})
export class AuthModule {
  constructor() {
    console.log('>>> [INSTANTIATE] AuthModule');
  }
}
