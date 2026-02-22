import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmtpSettings } from './smtp-settings.entity';

@Injectable()
export class MailService implements OnModuleInit {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter | null = null;
    private currentSettings: any = null;

    constructor(
        private configService: ConfigService,
        @InjectRepository(SmtpSettings)
        private smtpRepository: Repository<SmtpSettings>,
    ) { }

    async onModuleInit() {
        await this.initializeTransporter();
    }

    private async getSmtpConfig() {
        try {
            const dbSettings = await this.smtpRepository.findOne({ where: { id: 1 } });
            if (dbSettings && (dbSettings.useService || dbSettings.host)) {
                this.logger.log('Using SMTP settings from database');
                return {
                    host: dbSettings.host,
                    port: dbSettings.port,
                    user: dbSettings.user?.trim(),
                    pass: dbSettings.pass?.trim(),
                    service: dbSettings.useService ? dbSettings.service : undefined,
                    from: dbSettings.from,
                };
            }
        } catch (error) {
            this.logger.error('Error fetching SMTP settings from database', error);
        }

        // Fallback to .env
        this.logger.log('Using SMTP settings from environment variables');
        return {
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            user: this.configService.get<string>('SMTP_USER')?.trim(),
            pass: this.configService.get<string>('SMTP_PASS')?.trim(),
            from: this.configService.get<string>('SMTP_FROM'),
            service: 'gmail', // Default service if host is not provided
        };
    }

    async initializeTransporter() {
        const config = await this.getSmtpConfig();

        // Deep compare to avoid unnecessary re-initialization
        const configStr = JSON.stringify(config);
        if (this.currentSettings === configStr && this.transporter) {
            this.logger.debug('SMTP transporter already initialized with current settings');
            return;
        }

        this.logger.log('Initializing SMTP transporter', {
            service: config.service,
            host: config.host,
            port: config.port,
            user: config.user,
            hasPassword: !!config.pass,
        });

        const transportOptions: any = {
            auth: {
                user: config.user,
                pass: config.pass,
            },
        };

        if (config.service) {
            transportOptions.service = config.service;
        } else {
            transportOptions.host = config.host;
            transportOptions.port = config.port;
            transportOptions.secure = config.port === 465;
        }

        this.transporter = nodemailer.createTransport(transportOptions);
        this.currentSettings = configStr;

        try {
            await this.transporter.verify();
            this.logger.log('✅ SMTP server connection verified successfully');
        } catch (error: any) {
            this.logger.error('❌ SMTP connection verification failed', error.message);
            this.logger.warn('Email sending may fail. Please check SMTP configuration.');
        }
    }

    async sendOtp(email: string, otp: string) {
        this.logger.log(`Preparing to send OTP to: ${email}`);

        // Ensure transporter is up to date
        await this.initializeTransporter();

        const config = await this.getSmtpConfig();
        const from = config.from || '"LoveLink" <noreply@lovelink.com>';

        if (!this.transporter) {
            const error = 'Mail transporter not initialized';
            this.logger.error(error);
            throw new Error(error);
        }

        try {
            const mailOptions = {
                from,
                to: email,
                subject: 'Your LoveLink Verification Code',
                text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
                html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">Thank you for registering with LoveLink! Please use the following code to verify your account:</p>
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; letter-spacing: 8px; margin: 0; font-size: 36px;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `,
            };

            this.logger.debug('Sending email with options', {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
            });

            const result = await this.transporter.sendMail(mailOptions);

            this.logger.log(`✅ OTP email sent successfully to ${email}`, {
                messageId: result.messageId,
                response: result.response,
            });

            return { success: true, messageId: result.messageId };
        } catch (error: any) {
            this.logger.error(`❌ Failed to send OTP email to ${email}`, {
                error: error.message,
                code: error.code,
                command: error.command,
            });
            throw new Error(`Failed to send verification email: ${error.message}`);
        }
    }
}

