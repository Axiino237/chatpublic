import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmtpSettings } from './smtp-settings.entity';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([SmtpSettings])],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
