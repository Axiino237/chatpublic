import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.reportsSent)
    @JoinColumn({ name: 'reporterId' })
    reporter: User;

    @Column()
    reporterId: string;

    @ManyToOne(() => User, (user) => user.reportsReceived)
    @JoinColumn({ name: 'reportedId' })
    reported: User;

    @Column()
    reportedId: string;

    @Column({ type: 'text' })
    reason: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: 'pending' })
    status: string; // pending, resolved, dismissed

    @CreateDateColumn()
    createdAt: Date;
}
