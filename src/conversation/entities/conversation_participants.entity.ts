import { User } from 'src/auth/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum ParticipantType {
    SENDER = 'sender',
    RECEIVER = 'receiver',
}

export enum ParticipantRole {
    ADMIN = 'admin',
    USER = 'user',
}

export enum ParticipantColor {
    BLUE = 'blue',
    RED = 'red',
    GREEN = 'green',
    ORANGE = 'orange',
    YELLOW = 'yellow',
    LIGHT_BLUE = 'light_blue',
    PINK = 'pink',
    PURPLE = 'purple',
}

@Entity('conversation_participants')
@Unique(['conversation', 'user', 'type', 'isDeleted'])
export class ConversationParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'boolean',
        default: false,
    })
    isDeleted: boolean;

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
        enum: ParticipantRole,
        default: ParticipantRole.USER,
    })
    role: ParticipantRole;

    @Column({
        type: 'enum',
        enum: ParticipantType,
    })
    type: ParticipantType;

    @CreateDateColumn()
    createdAt: Date;

    @Column({
        type: 'enum',
        enum: ParticipantColor,
        nullable: true,
    })
    color?: ParticipantColor;
}
