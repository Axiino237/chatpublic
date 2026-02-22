import { format, transports } from 'winston';
import { WinstonModuleOptions } from 'nest-winston';
import 'winston-daily-rotate-file';

export const loggerOptions: WinstonModuleOptions = {
    transports: [
        new transports.Console({
            format: format.combine(
                format.timestamp(),
                format.ms(),
                format.colorize(),
                format.printf(({ timestamp, level, message, context, ms }) => {
                    return `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message} ${ms}`;
                }),
            ),
        }),
        new transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: format.combine(
                format.timestamp(),
                format.json(),
            ),
        }),
        new transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'error',
            format: format.combine(
                format.timestamp(),
                format.json(),
            ),
        }),
    ],
};
