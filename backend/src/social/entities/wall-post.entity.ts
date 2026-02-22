import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('wall_posts')
export class WallPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar', nullable: true })
    imageUrl: string;

    @Column({ default: 0 })
    likesCount: number;

    @Column({ default: 0 })
    commentsCount: number;

    @Column({ default: false })
    isPinned: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
