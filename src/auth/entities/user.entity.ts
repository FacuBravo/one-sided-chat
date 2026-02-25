import { Chat } from 'src/chats/entities/chat.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Invitation } from 'src/groups/entities/invitation.entity';
import { Message } from 'src/message/entities/message.entity';
import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 50,
    })
    fullName: string;

    @Column({
        type: 'varchar',
        length: 30,
        unique: true,
    })
    username: string;

    @Column({
        type: 'varchar',
        length: 5,
    })
    country_code: string;

    @Column({
        type: 'varchar',
        length: 2,
    })
    country_iso: string;

    @Column({
        type: 'varchar',
        length: 15,
    })
    phone_number: string;

    @Column({
        type: 'varchar',
        length: 20,
        unique: true,
    })
    phone_e164: string;

    @Column({
        type: 'text',
        nullable: true,
        unique: true,
        select: false,
    })
    refreshToken?: string | null;

    @Column({
        type: 'boolean',
        default: false,
    })
    phoneVerified: boolean;

    @ManyToMany(() => Group, (group) => group.usersSenders)
    groups: Group[];

    @ManyToMany(() => Group, (group) => group.usersReceivers)
    groupsJoined: Group[];

    @OneToMany(() => Chat, (chat) => chat.userSender)
    chatsSender: Chat[];

    @ManyToMany(() => Chat, (chat) => chat.usersReceivers)
    chatsReceiver: Chat[];

    @OneToMany(() => Invitation, (invitation) => invitation.userSender)
    invitationsSent: Invitation[];

    @OneToMany(() => Invitation, (invitation) => invitation.userReceiver)
    invitationsReceived: Invitation[];

    @OneToMany(() => Message, (message) => message.userSender)
    messages: Message[];

    @ManyToMany(() => Conversation, (conversation) => conversation.usersSenders)
    @JoinTable()
    conversationsSenders: Conversation[];

    @ManyToMany(
        () => Conversation,
        (conversation) => conversation.usersReceivers,
    )
    @JoinTable()
    conversationsReceivers: Conversation[];
}
