import { User } from 'src/auth/entities/user.entity';
import { Invitation } from 'src/conversation/entities/invitation.entity';
import { Message } from 'src/message/entities/message.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ['group', 'private', 'list'],
    })
    type: 'group' | 'private' | 'list';

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true, type: 'varchar', length: 50 })
    name?: string;

    @Column({ nullable: true, type: 'varchar', length: 100 })
    description?: string;

    @Column({ nullable: true })
    lastMessageId?: string;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

    @ManyToMany(() => User, (user) => user.conversationsSenders)
    @JoinTable()
    usersSenders: User[];

    @ManyToMany(() => User, (user) => user.conversationsReceivers)
    @JoinTable()
    usersReceivers: User[];

    @OneToMany(() => Invitation, (invitation) => invitation.conversation)
    invitations: Invitation[];
}
