import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient();
            const authToken = client.handshake.auth?.token;

            if (!authToken) {
                throw new WsException('No token provided');
            }

            const payload = await this.jwtService.verifyAsync(authToken);
            // Attach user to client with both id and userId for compatibility
            client.data.user = {
                ...payload,
                id: payload.sub,
                userId: payload.sub
            };

            return true;
        } catch (err) {
            throw new WsException('Unauthorized');
        }
    }
}
