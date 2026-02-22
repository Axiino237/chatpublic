import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Message } from '../chat/message.entity';
import { Friendship } from '../social/entities/friendship.entity';
import { WallPost } from '../social/entities/wall-post.entity';
import { UserGift } from '../social/entities/user-gift.entity';
import { Notification } from '../notifications/notification.entity';
import { SupportMessage } from '../support/support-message.entity';
import { Block } from '../blocks/block.entity';
import { Report } from '../reports/report.entity';
import { Ban } from '../admin/ban.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ type: 'varchar', unique: true, nullable: true })
    username: string | null;

    @Column()
    passwordHash: string;

    @Column({ type: 'varchar', nullable: true })
    hashedRefreshToken: string | null;

    @Column({ type: 'varchar', nullable: true })
    firstName: string | null;

    @Column({ type: 'varchar', nullable: true })
    lastName: string | null;

    @Column({ type: 'varchar', nullable: true })
    bio: string | null;

    @Column({ type: 'varchar', nullable: true })
    gender: string | null;

    @Column({ type: 'varchar', nullable: true })
    interestedIn: string | null;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date | null;

    @Column({ type: 'varchar', nullable: true })
    profilePictureUrl: string | null;

    @Column({ type: 'varchar', nullable: true })
    location: string | null;

    @Column({ type: 'varchar', nullable: true })
    nationality: string | null;

    @Column("simple-array", { nullable: true })
    languages: string[] | null;

    @Column("simple-array", { nullable: true })
    travelBucketList: string[] | null;

    @Column("simple-array", { nullable: true })
    culturalInterests: string[] | null;

    @Column({ default: 'user' })
    role: string;

    @Column({ type: 'timestamp', nullable: true })
    mutedUntil: Date | null;

    @Column({ default: 0 })
    points: number;

    @Column({ default: 'Newbie' })
    badge: string;

    @Column({ default: false })
    isSuspended: boolean;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ default: false })
    isBot: boolean;

    @Column({ default: false })
    isGuest: boolean;

    @Column({ type: 'varchar', nullable: true })
    otpCode: string | null;

    @Column({ default: 'active' })
    status: string;

    @Column({ type: 'timestamp', nullable: true })
    otpExpiresAt: Date | null;

    @Column({ type: 'varchar', nullable: true })
    lastLoginIp: string | null;

    @Column({ type: 'timestamp', nullable: true })
    lastLoginAt: Date | null;

    @Column({ type: 'varchar', nullable: true })
    deviceId: string | null;

    @Column({ type: 'varchar', nullable: true })
    deviceType: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    /* */
    @OneToMany(() => Message, (message) => message.sender)
    sentMessages: Message[];

    @OneToMany(() => Message, (message) => message.receiver)
    receivedMessages: Message[];

    @OneToMany(() => Friendship, (friendship) => friendship.requester)
    friendshipsRequested: Friendship[];

    @OneToMany(() => Friendship, (friendship) => friendship.addressee)
    friendshipsReceived: Friendship[];

    @OneToMany(() => WallPost, (post) => post.user)
    posts: WallPost[];

    @OneToMany(() => UserGift, (gift) => gift.sender)
    giftsSent: UserGift[];

    @OneToMany(() => UserGift, (gift) => gift.receiver)
    giftsReceived: UserGift[];

    @OneToMany(() => Block, (block) => block.blocker)
    blockedUsers: Block[];

    @OneToMany(() => Block, (block) => block.blocked)
    blockedByUsers: Block[];

    @OneToMany(() => Report, (report) => report.reporter)
    reportsSent: Report[];

    @OneToMany(() => Report, (report) => report.reported)
    reportsReceived: Report[];

    @OneToMany(() => Ban, (ban) => ban.user)
    bans: Ban[];

    @OneToMany(() => Ban, (ban) => ban.bannedBy)
    bansIssued: Ban[];

    @OneToMany(() => Notification, (notification) => notification.user)
    notifications: Notification[];

    @OneToMany(() => SupportMessage, (supportMessage) => supportMessage.user)
    supportMessages: SupportMessage[];

    @OneToMany(() => SupportMessage, (supportMessage) => supportMessage.repliedBy)
    supportRepliesIssued: SupportMessage[];
}
