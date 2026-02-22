import { User } from 'src/auth/entities/user.entity';
import { Chat } from 'src/chats/entities/chat.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Invitation } from './invitation.entity';

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToMany(() => User, (user) => user.groups, { onDelete: 'CASCADE' })
    @JoinTable()
    usersSenders: User[];

    @ManyToMany(() => User, (user) => user.groupsJoined, {
        onDelete: 'CASCADE',
    })
    @JoinTable()
    usersReceivers: User[];

    @OneToMany(() => Chat, (chat) => chat.group, { onDelete: 'CASCADE' })
    chats: Chat[];

    @OneToMany(() => Invitation, (invitation) => invitation.group, {
        onDelete: 'CASCADE',
    })
    invitations: Invitation[];
}
