import { User } from 'src/auth/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';

@Entity('invitations')
export class Invitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'accepted', 'rejected'],
    })
    state: 'pending' | 'accepted' | 'rejected';

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.invitationsSent)
    userSender: User;

    @ManyToOne(() => User, (user) => user.invitationsReceived)
    userReceiver: User;

    @ManyToOne(() => Group, (group) => group.invitations)
    group: Group;
}
