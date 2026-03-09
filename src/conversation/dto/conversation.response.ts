import { UserResponseDto } from 'src/auth/dto';
import { MessageResponseDto } from 'src/message/dto/message.response';
import { PaginationResponse } from 'src/utils/dtos/pagination-response';

export interface ConversationResponseDto {
    id: string;
    name?: string;
    description?: string;
    createdAt: Date;
    lastMessage: MessageResponseDto | null;
    usersSenders: UserResponseDto[];
    usersReceivers: UserResponseDto[];
    lastMessageSeq: number;
    totalUnreadMessages: number;
}

export interface ConversationDetailResponseDTO {
    id: string;
    name?: string;
    description?: string;
    createdAt: Date;
    usersSenders: UserResponseDto[];
    usersReceivers: UserResponseDto[];
    messages: PaginationResponse<MessageResponseDto>;
    hasUnreadMessages: boolean;
}

export interface SimpleConversationResponseDto {
    id: string;
    name?: string;
    description?: string;
    usersReceivers: UserResponseDto[];
}
