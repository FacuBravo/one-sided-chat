import { User } from 'src/auth/entities/user.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

@Entity('messages')
@Index(['conversation', 'seq'])
@Unique(['conversation', 'seq'])
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'bigint' })
    seq: number;

    @Column({ type: 'text' })
    text: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => User)
    userSender: User;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
        onDelete: 'CASCADE',
    })
    conversation: Conversation;
}
