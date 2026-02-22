import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('gifts')
export class Gift {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    icon: string; // Emoji or SVG name

    @Column({ default: 0 })
    price: number; // For future coin system, or just for ranking rarity

    @Column({ default: 'common' }) // common, rare, epic, legendary
    rarity: string;

    @CreateDateColumn()
    createdAt: Date;
}
