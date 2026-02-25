import { MessageResponseDto } from 'src/message/dto/message.response';
import { ConversationResponseDto } from '../dto/conversation.response';
import { Conversation } from '../entities/conversation.entity';
import { usersMapper } from 'src/auth/mappers/user.mapper';

export const conversationsMapper = (
    conversations: Conversation[],
    lastMessages: (MessageResponseDto | null)[],
): ConversationResponseDto[] => {
    return conversations.map((conversation, index) => ({
        id: conversation.id,
        name: conversation.name,
        description: conversation.description,
        createdAt: conversation.createdAt,
        lastMessage: lastMessages[index],
        usersReceivers: usersMapper(conversation.usersReceivers),
    }));
};
