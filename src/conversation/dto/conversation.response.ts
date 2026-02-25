import { UserResponseDto } from 'src/auth/dto';
import { MessageResponseDto } from 'src/message/dto/message.response';

export interface ConversationResponseDto {
    id: string;
    name?: string;
    description?: string;
    createdAt: Date;
    lastMessage: MessageResponseDto | null;
    usersReceivers: UserResponseDto[];
}
