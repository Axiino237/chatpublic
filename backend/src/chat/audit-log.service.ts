import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async log(data: {
        actionType: string;
        roomId?: string;
        adminId: string;
        reason?: string;
        ipAddress?: string;
        details?: any;
    }): Promise<AuditLog> {
        const logEntry = this.auditLogRepository.create({
            ...data,
            timestamp: new Date()
        });
        return this.auditLogRepository.save(logEntry);
    }
}
