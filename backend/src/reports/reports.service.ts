import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Report } from './report.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
    ) { }

    async reportUser(reporter: User, reportedId: string, reason: string, description?: string): Promise<Report> {
        if (reporter.id === reportedId) {
            throw new Error('You cannot report yourself');
        }

        // Optional: Check if a similar report exists from this user in the last hour
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const existing = await this.reportsRepository.findOne({
            where: {
                reporter: { id: reporter.id },
                reported: { id: reportedId },
                createdAt: MoreThan(oneHourAgo)
            }
        });

        if (existing) {
            throw new Error('You have already reported this user recently.');
        }

        const report = this.reportsRepository.create({
            reporter,
            reported: { id: reportedId } as User,
            reason,
            description,
        });
        return this.reportsRepository.save(report);
    }

    async getAllReports(): Promise<Report[]> {
        return this.reportsRepository.find({
            relations: ['reporter', 'reported'],
            order: { createdAt: 'DESC' },
        });
    }

    async updateStatus(reportId: string, status: string): Promise<Report> {
        await this.reportsRepository.update(reportId, { status });
        const report = await this.reportsRepository.findOne({ where: { id: reportId } });
        if (!report) throw new Error('Report not found');
        return report;
    }
}
