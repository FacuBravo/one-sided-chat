import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chats')
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: string;
}
