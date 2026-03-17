import { MessageResponseDto } from 'src/message/dto/message.response';
import {
    ConversationDetailResponseDTO,
    ConversationResponseDto,
    SimpleConversationResponseDto,
} from '../dto/conversation.response';
import { Conversation } from '../entities/conversation.entity';
import {
    conversationUsersMapper,
    usersMapper,
} from 'src/auth/mappers/user.mapper';
import { ContactResponseDto } from 'src/contacts/dto/contact.response';
import { PaginationResponse } from 'src/utils/dtos/pagination-response';
import {
    ConversationParticipant,
    ParticipantRole,
    ParticipantType,
} from '../entities/conversation_participants.entity';

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

        const usersSenders = conversation.participants
            .filter((p) => p.type === 'sender')
            .map((p) => p.user);

        const usersReceivers = conversation.participants
            .filter((p) => p.type === 'receiver')
            .map((p) => p.user);

        return {
            id: conversation.id,
            name: conversation.name,
            description: conversation.description,
            createdAt: conversation.createdAt,
            lastMessage: lastMessage || null,
            usersSenders: conversationUsersMapper(
                usersSenders,
                conversation.participants,
                ParticipantType.SENDER,
                contactsSenders,
            ),
            usersReceivers: conversationUsersMapper(
                usersReceivers,
                conversation.participants,
                ParticipantType.RECEIVER,
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
    const usersSenders = conversation.participants
        .filter((p) => p.type === 'sender')
        .map((p) => p.user);

    const usersReceivers = conversation.participants
        .filter((p) => p.type === 'receiver')
        .map((p) => p.user);

    return {
        id: conversation.id,
        name: conversation.name,
        description: conversation.description,
        createdAt: conversation.createdAt,
        usersSenders: conversationUsersMapper(
            usersSenders,
            conversation.participants,
            ParticipantType.SENDER,
            contactsSenders,
        ),
        usersReceivers: conversationUsersMapper(
            usersReceivers,
            conversation.participants,
            ParticipantType.RECEIVER,
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
        const usersReceivers = conversation.participants
            .filter((p) => p.type === 'receiver')
            .map((p) => p.user);

        return {
            id: conversation.id,
            name: conversation.name,
            description: conversation.description,
            usersReceivers: usersMapper(usersReceivers),
        };
    });
};
