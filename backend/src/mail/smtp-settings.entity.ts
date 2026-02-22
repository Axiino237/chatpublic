import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('smtp_settings')
export class SmtpSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    host: string;

    @Column({ type: 'int', nullable: true })
    port: number;

    @Column({ nullable: true })
    user: string;

    @Column({ nullable: true })
    pass: string;

    @Column({ nullable: true })
    from: string;

    @Column({ default: false })
    useService: boolean;

    @Column({ default: 'gmail' })
    service: string;

    @UpdateDateColumn()
    updatedAt: Date;
}
