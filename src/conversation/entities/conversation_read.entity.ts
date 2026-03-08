import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
    Unique,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from 'src/auth/entities/user.entity';

@Entity('conversation_reads')
@Unique('uniq_conversation_user', ['conversation', 'user'])
@Index('idx_conversation_reads_user', ['user'])
export class ConversationRead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'bigint', default: 0 })
    lastReadSeq: number;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
