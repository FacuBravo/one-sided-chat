import { MessageResponseDto } from 'src/message/dto/message.response';
import { ConversationResponseDto } from '../dto/conversation.response';
import { Conversation } from '../entities/conversation.entity';
import { usersMapper } from 'src/auth/mappers/user.mapper';
import { ContactResponseDto } from 'src/contacts/dto/contact.response';

export const conversationsMapper = (
    conversations: Conversation[],
    lastMessages: (MessageResponseDto | null)[],
    contacts: ContactResponseDto[],
): ConversationResponseDto[] => {
    return conversations.map((conversation, index) => ({
        id: conversation.id,
        name: conversation.name,
        description: conversation.description,
        createdAt: conversation.createdAt,
        lastMessage: lastMessages[index],
        usersReceivers: usersMapper(conversation.usersReceivers, contacts),
    }));
};
