import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('bans')
export class Ban {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.bans)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.bansIssued)
    @JoinColumn({ name: 'bannedById' })
    bannedBy: User;

    @Column()
    bannedById: string;

    @Column()
    reason: string;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt: Date | null;

    @Column({ type: 'varchar', nullable: true })
    ipAddress: string | null;

    @Column({ type: 'varchar', nullable: true })
    deviceId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
