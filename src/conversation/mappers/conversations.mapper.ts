import { MessageResponseDto } from 'src/message/dto/message.response';
import {
    ConversationDetailResponseDTO,
    ConversationResponseDto,
    SimpleConversationResponseDto,
} from '../dto/conversation.response';
import { Conversation } from '../entities/conversation.entity';
import { usersMapper } from 'src/auth/mappers/user.mapper';
import { ContactResponseDto } from 'src/contacts/dto/contact.response';
import { PaginationResponse } from 'src/utils/dtos/pagination-response';

export type UnreadMessages = {
    conversationId: string;
    count: number;
};

export const conversationsMapper = (
    conversations: Conversation[],
    contactsReceivers: ContactResponseDto[] = [],
    contactsSenders: ContactResponseDto[] = [],
    lastMessages: MessageResponseDto[] = [],
    unreadMessages: UnreadMessages[] = [],
): ConversationResponseDto[] => {
    return conversations.map((conversation) => {
        const lastMessage = lastMessages.find(
            (m) => m.id === conversation.lastMessageId,
        );

        const unreadMessage = unreadMessages.find(
            (m) => m.conversationId === conversation.id,
        );

        return {
            id: conversation.id,
            name: conversation.name,
            description: conversation.description,
            createdAt: conversation.createdAt,
            lastMessage: lastMessage || null,
            usersSenders: usersMapper(
                conversation.usersSenders,
                contactsSenders,
            ),
            usersReceivers: usersMapper(
                conversation.usersReceivers,
                contactsReceivers,
            ),
            lastMessageSeq: conversation.lastMessageSeq,
            totalUnreadMessages: unreadMessage?.count || 0,
        };
    });
};

export const fullConversationMapper = (
    conversation: Conversation,
    messages: PaginationResponse<MessageResponseDto>,
    contactsReceivers: ContactResponseDto[] = [],
    contactsSenders: ContactResponseDto[] = [],
    unreadCount: number = 0,
): ConversationDetailResponseDTO => {
    return {
        id: conversation.id,
        name: conversation.name,
        description: conversation.description,
        createdAt: conversation.createdAt,
        usersSenders: usersMapper(conversation.usersSenders, contactsSenders),
        usersReceivers: usersMapper(
            conversation.usersReceivers,
            contactsReceivers,
        ),
        messages,
        hasUnreadMessages: unreadCount > 0,
    };
};

export const simpleConversationsMapper = (
    conversations: Conversation[],
): SimpleConversationResponseDto[] => {
    return conversations.map((conversation) => {
        return {
            id: conversation.id,
            name: conversation.name,
            description: conversation.description,
            usersReceivers: usersMapper(conversation.usersReceivers),
        };
    });
};
