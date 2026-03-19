import { MessageResponseDto } from 'src/message/dto/message.response';

export interface MessagePush {
    tokens: string[];
    titles: string[];
    body: string;
    data: MessagePushData;
}

interface MessagePushData {
    conversationId: string;
    message: MessageResponseDto;
}
