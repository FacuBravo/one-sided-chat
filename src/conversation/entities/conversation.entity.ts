import { User } from 'src/auth/entities/user.entity';
import { Invitation } from 'src/invitation/entities/invitation.entity';
import { Message } from 'src/message/entities/message.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ConversationParticipant } from './conversation_participants.entity';

@Entity('conversations')
@Index('idx_conversations_updated_at', ['updatedAt'])
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ['group', 'private', 'list'],
    })
    type: 'group' | 'private' | 'list';

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ nullable: true, type: 'varchar', length: 50 })
    name?: string;

    @Column({ nullable: true, type: 'varchar', length: 100 })
    description?: string;

    @Column({ nullable: true })
    lastMessageId?: string;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt?: Date;

    @Column({ type: 'bigint', default: 0 })
    lastMessageSeq: number;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

    @OneToMany(
        () => ConversationParticipant,
        (participant) => participant.conversation,
    )
    participants: ConversationParticipant[];

    @OneToMany(() => Invitation, (invitation) => invitation.conversation)
    invitations: Invitation[];
}
