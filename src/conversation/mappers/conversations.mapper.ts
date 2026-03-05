import { MessageResponseDto } from 'src/message/dto/message.response';
import { ConversationResponseDto } from '../dto/conversation.response';
import { Conversation } from '../entities/conversation.entity';
import { usersMapper } from 'src/auth/mappers/user.mapper';
import { ContactResponseDto } from 'src/contacts/dto/contact.response';
import { PaginationResponse } from 'src/utils/dtos/pagination-response';

export const conversationsMapper = (
    conversations: Conversation[],
    contactsReceivers: ContactResponseDto[] = [],
    contactsSenders: ContactResponseDto[] = [],
    lastMessages: (MessageResponseDto | null)[] = [],
): ConversationResponseDto[] => {
    return conversations.map((conversation, index) => ({
        id: conversation.id,
        name: conversation.name,
        description: conversation.description,
        createdAt: conversation.createdAt,
        lastMessage: lastMessages[index],
        usersSenders: usersMapper(conversation.usersSenders, contactsSenders),
        usersReceivers: usersMapper(
            conversation.usersReceivers,
            contactsReceivers,
        ),
    }));
};

export const fullConversationMapper = (
    conversation: Conversation,
    messages: PaginationResponse<MessageResponseDto>,
    contactsReceivers: ContactResponseDto[] = [],
    contactsSenders: ContactResponseDto[] = [],
) => {
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
    };
};
