import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class UserStatusGuard implements CanActivate {
    constructor(private usersService: UsersService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;

        if (!userId) return true;

        const user = await this.usersService.findOneById(userId);
        if (!user) throw new UnauthorizedException('User not found');

        if (user.isSuspended) {
            throw new UnauthorizedException('Your account has been suspended');
        }

        return true;
    }
}
