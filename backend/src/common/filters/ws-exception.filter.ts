import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(WsExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const client = host.switchToWs().getClient<Socket>();
        const data = host.switchToWs().getData();

        let message = 'An error occurred';
        let code = 'INTERNAL_ERROR';

        if (exception instanceof WsException) {
            message = exception.message;
            code = 'WS_ERROR';
        } else if (exception instanceof BadRequestException) {
            const response = exception.getResponse();
            message = typeof response === 'string' ? response : (response as any).message;
            code = 'BAD_REQUEST';
        } else if (exception instanceof Error) {
            message = exception.message;
            code = 'ERROR';
        }

        // Log the error
        this.logger.error(
            `WebSocket Error - Client: ${client.id} - Code: ${code} - Message: ${message}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        // Send structured error to client
        client.emit('error', {
            code,
            message,
            timestamp: new Date().toISOString(),
            data: data || null,
        });
    }
}
