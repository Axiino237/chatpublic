import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    content: string;

    @ManyToOne(() => User, (user) => user.sentMessages)
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @Column()
    senderId: string;

    @ManyToOne(() => User, (user) => user.receivedMessages, { nullable: true })
    @JoinColumn({ name: 'receiverId' })
    receiver: User;

    @Column({ nullable: true })
    receiverId: string;

    @Column({ default: 'text' }) // text, image, system
    type: string;

    @Column({ nullable: true })
    roomId: string;

    @Column('simple-array', { nullable: true })
    taggedUserIds: string[];

    @Column({ default: false })
    isPrivate: boolean;

    @Column({ default: false })
    isHidden: boolean;

    @Column({ nullable: true })
    hiddenReason: string;

    @CreateDateColumn()
    createdAt: Date;
}
