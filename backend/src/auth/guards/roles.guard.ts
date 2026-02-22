import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private usersService: UsersService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            return false;
        }

        const fullUser = await this.usersService.findOneById(user.userId);
        if (!fullUser) return false;

        const hasRole = requiredRoles.some((role) => fullUser.role === role);
        if (!hasRole) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}
