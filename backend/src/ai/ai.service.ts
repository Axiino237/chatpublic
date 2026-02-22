import { Injectable } from '@nestjs/common';
import { User } from '../users/user.entity';

@Injectable()
export class AiService {
    async generateIcebreaker(user: User, target: User): Promise<string> {
        const commonInterests = user.interestedIn === target.gender ? 'travel and movies' : 'music and food'; // Simple mock
        return `Hey ${target.firstName}! I see we both like ${commonInterests}. What's your favorite thing about them?`;
    }

    async calculateCompatibility(user: User, target: User): Promise<number> {
        // Simple mock algorithm
        let score = 70;
        if (user.interestedIn === target.gender) score += 15;
        if (user.location === target.location) score += 10;
        return Math.min(score, 99);
    }
}
