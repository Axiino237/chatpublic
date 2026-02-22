import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class GamificationService {
    constructor(private usersService: UsersService) { }

    private badgeThresholds = [
        { points: 1000, name: 'Chatterbox' },
        { points: 5000, name: 'Lounge Legend' },
        { points: 10000, name: 'Social Star' },
        { points: 50000, name: 'Elite Member' }
    ];

    async awardPoints(userId: string, points: number) {
        const user = await this.usersService.findOneById(userId);
        if (!user) return;

        const newPoints = user.points + points;
        let newBadge = user.badge;

        // Check for badge upgrade
        for (const threshold of this.badgeThresholds) {
            if (newPoints >= threshold.points) {
                newBadge = threshold.name;
            }
        }

        await this.usersService.update(userId, {
            points: newPoints,
            badge: newBadge
        });

        return { points: newPoints, badge: newBadge, role: user.role };
    }
}
