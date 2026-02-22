import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    roomName: string;

    @Column({ nullable: true })
    roomDescription: string;

    @Column({ default: 'PUBLIC' }) // PUBLIC, PRIVATE
    roomType: string;

    @Column({ type: 'varchar', nullable: true })
    createdBy: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @Column({ type: 'varchar', nullable: true })
    deletedBy: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
