import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        unique: true,
    })
    email: string;

    @Column({
        type: 'text',
        select: false,
        nullable: true,
    })
    password: string;

    @Column({
        type: 'varchar',
        default: 'regular',
        length: 7,
    })
    loginType: 'regular' | 'google';

    @BeforeInsert()
    @BeforeUpdate()
    private checkBeforeInsert() {
        this.email = this.email.toLocaleLowerCase().trim();
    }
}
