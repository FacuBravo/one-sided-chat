import { User } from 'src/auth/entities/user.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('contacts')
export class Contact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50 })
    name?: string;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => User)
    referencedUser: User;
}
