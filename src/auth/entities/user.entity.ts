import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
    })
    fullName: string;

    @Column({
        type: 'varchar',
        length: 30,
        nullable: false,
        unique: true,
    })
    username: string;

    @Column({
        type: 'varchar',
        length: 5,
        nullable: false,
    })
    country_code: string;

    @Column({
        type: 'varchar',
        length: 2,
        nullable: false,
    })
    country_iso: string;

    @Column({
        type: 'varchar',
        length: 15,
        nullable: false,
    })
    phone_number: string;

    @Column({
        type: 'varchar',
        length: 20,
        nullable: false,
        unique: true,
    })
    phone_e164: string;

    @Column({
        type: 'text',
        nullable: true,
        unique: true,
    })
    refreshToken?: string | null;

    @Column({
        type: 'boolean',
        default: false,
    })
    phoneVerified: boolean;
}
