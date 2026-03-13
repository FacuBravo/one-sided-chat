import { User } from 'src/auth/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum ParticipantType {
    SENDER = 'sender',
    RECEIVER = 'receiver',
}

@Entity('conversation_participants')
export class ConversationParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(
        () => Conversation,
        (conversation) => conversation.participants,
        {
            onDelete: 'CASCADE',
        },
    )
    conversation: Conversation;

    @ManyToOne(() => User, (user) => user.conversationParticipants, {
        onDelete: 'CASCADE',
    })
    user: User;

    @Column({
        type: 'enum',
        enum: ParticipantType,
    })
    type: ParticipantType;

    @CreateDateColumn()
    createdAt: Date;
}
