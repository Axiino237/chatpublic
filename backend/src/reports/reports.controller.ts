import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post()
    async reportUser(
        @Request() req,
        @Body('reportedId') reportedId: string,
        @Body('reason') reason: string,
        @Body('description') description?: string,
    ) {
        return this.reportsService.reportUser(req.user, reportedId, reason, description);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'monitor')
    async getReports() {
        return this.reportsService.getAllReports();
    }

    @Post(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'monitor')
    async updateStatus(
        @Body('status') status: string,
        @Request() req,
    ) {
        // status: 'resolved', 'dismissed'
        return this.reportsService.updateStatus(req.params.id, status);
    }
}
