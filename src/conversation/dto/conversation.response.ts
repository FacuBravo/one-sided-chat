import { ConversationUserDto, UserResponseDto } from 'src/auth/dto';
import { MessageResponseDto } from 'src/message/dto/message.response';
import { PaginationResponse } from 'src/utils/dtos/pagination-response';

export interface ConversationResponseDto {
    id: string;
    name?: string;
    description?: string;
    createdAt: Date;
    lastMessage: MessageResponseDto | null;
    usersSenders: ConversationUserDto[];
    usersReceivers: ConversationUserDto[];
    lastMessageSeq: number;
    totalUnreadMessages: number;
}

export interface ConversationDetailResponseDTO {
    id: string;
    name?: string;
    description?: string;
    createdAt: Date;
    usersSenders: ConversationUserDto[];
    usersReceivers: ConversationUserDto[];
    messages: PaginationResponse<MessageResponseDto>;
    hasUnreadMessages: boolean;
}

export interface SimpleConversationResponseDto {
    id: string;
    name?: string;
    description?: string;
    usersReceivers: UserResponseDto[];
}
