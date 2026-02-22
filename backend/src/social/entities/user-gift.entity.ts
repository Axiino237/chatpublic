import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Gift } from './gift.entity';

@Entity('user_gifts')
export class UserGift {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    giftId: string;

    @ManyToOne(() => Gift)
    @JoinColumn({ name: 'giftId' })
    gift: Gift;

    @Column()
    senderId: string;

    @ManyToOne(() => User, (user) => user.giftsSent)
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @Column()
    receiverId: string;

    @ManyToOne(() => User, (user) => user.giftsReceived)
    @JoinColumn({ name: 'receiverId' })
    receiver: User;

    @Column({ type: 'text', nullable: true })
    message: string;

    @CreateDateColumn()
    createdAt: Date;
}
