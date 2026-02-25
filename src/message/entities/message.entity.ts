import { User } from 'src/auth/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    text: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'uuid', array: true })
    readBy: string[];

    @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
    userSender: User;
}
