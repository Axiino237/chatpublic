import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('friendships')
@Unique(['requesterId', 'addresseeId'])
export class Friendship {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    requesterId: string;

    @ManyToOne(() => User, (user) => user.friendshipsRequested)
    @JoinColumn({ name: 'requesterId' })
    requester: User;

    @Column()
    addresseeId: string;

    @ManyToOne(() => User, (user) => user.friendshipsReceived)
    @JoinColumn({ name: 'addresseeId' })
    addressee: User;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'],
        default: 'PENDING'
    })
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

    @CreateDateColumn()
    createdAt: Date;
}
