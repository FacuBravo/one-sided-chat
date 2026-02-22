import { User } from 'src/auth/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chats')
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Group, (group) => group.chats, { nullable: true })
    group?: Group;

    @ManyToOne(() => User, (user) => user.chatsSender, { nullable: true })
    userSender?: User;

    @ManyToOne(() => User, (user) => user.chatsReceiver, { nullable: true })
    userReceiver?: User;
}
