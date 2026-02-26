import { Conversation } from 'src/conversation/entities/conversation.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

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

    @ManyToMany(() => Conversation, (conversation) => conversation.usersSenders)
    conversationsSenders: Conversation[];

    @ManyToMany(
        () => Conversation,
        (conversation) => conversation.usersReceivers,
    )
    conversationsReceivers: Conversation[];
}
