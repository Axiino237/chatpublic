import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('admin_settings')
export class AdminSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: true })
    sessionControlEnabled: boolean;

    @Column({ default: 30 })
    passwordExpiryDays: number;

    @Column({ default: true })
    passwordExpiryEnabled: boolean;

    @UpdateDateColumn()
    updatedAt: Date;
}
