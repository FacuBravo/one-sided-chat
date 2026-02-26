import { User } from 'src/auth/entities/user.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
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

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ type: 'uuid', array: true })
    readBy: string[];

    @ManyToOne(() => User)
    userSender: User;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
        onDelete: 'CASCADE',
    })
    conversation: Conversation;
}
