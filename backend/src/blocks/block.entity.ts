import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('blocks')
@Unique(['blocker', 'blocked'])
export class Block {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.blockedUsers)
    @JoinColumn({ name: 'blockerId' })
    blocker: User;

    @Column()
    blockerId: string;

    @ManyToOne(() => User, (user) => user.blockedByUsers)
    @JoinColumn({ name: 'blockedId' })
    blocked: User;

    @Column()
    blockedId: string;

    @CreateDateColumn()
    createdAt: Date;
}
