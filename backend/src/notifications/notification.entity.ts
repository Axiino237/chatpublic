import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.notifications)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column()
    type: string; // match, message, support, system

    @Column({ type: 'text' })
    content: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    relatedId: string; // e.g., threadId or matchId

    @CreateDateColumn()
    createdAt: Date;
}
