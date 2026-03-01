import { usersMapper } from 'src/auth/mappers/user.mapper';
import { MessageResponseDto } from '../dto/message.response';
import { Message } from '../entities/message.entity';

export const messagesMapper = (messages: Message[]): MessageResponseDto[] => {
    return messages.map((message) => ({
        id: message.id,
        text: message.text,
        createdAt: message.createdAt,
        readBy: message.readBy,
        userSender: usersMapper([message.userSender])[0],
    }));
};
