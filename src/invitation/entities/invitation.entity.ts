import { User } from 'src/auth/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from 'src/conversation/entities/conversation.entity';

export enum InvitationState {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

@Entity('invitations')
export class Invitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: InvitationState,
        default: 'pending',
    })
    state: InvitationState;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    solvedAt?: Date;

    @ManyToOne(() => User)
    userSender: User;

    @ManyToOne(() => User)
    userReceiver: User;

    @ManyToOne(() => Conversation, (conversation) => conversation.invitations, {
        onDelete: 'CASCADE',
    })
    conversation: Conversation;
}
