import { User } from 'src/auth/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from 'src/conversation/entities/conversation.entity';

@Entity('invitations')
export class Invitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    })
    state: 'pending' | 'accepted' | 'rejected';

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    userSender: User;

    @ManyToOne(() => User)
    userReceiver: User;

    @ManyToOne(() => Conversation, (conversation) => conversation.invitations, {
        onDelete: 'CASCADE',
    })
    conversation: Conversation;
}
