import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    actionType: string; // room_created, room_updated, room_deleted, message_hidden, user_muted

    @Column({ nullable: true })
    roomId: string;

    @Column()
    adminId: string;

    @Column({ nullable: true })
    reason: string;

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ type: 'json', nullable: true })
    details: any;

    @CreateDateColumn()
    timestamp: Date;
}
