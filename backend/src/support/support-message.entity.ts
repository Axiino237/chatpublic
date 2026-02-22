import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('support_messages')
export class SupportMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.supportMessages)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column()
    subject: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'text', nullable: true })
    reply: string | null;

    @ManyToOne(() => User, (user) => user.supportRepliesIssued, { nullable: true })
    @JoinColumn({ name: 'repliedById' })
    repliedBy: User | null;

    @Column({ nullable: true })
    repliedById: string;

    @Column({ default: 'open' })
    status: string; // open, resolved

    @CreateDateColumn()
    createdAt: Date;
}
