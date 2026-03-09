import { UserResponseDto } from 'src/auth/dto';
import { SimpleConversationResponseDto } from 'src/conversation/dto/conversation.response';
import { InvitationState } from '../entities/invitation.entity';

export interface InvitationResponseDto {
    id: string;
    state: InvitationState;
    createdAt: Date;
    solvedAt?: Date;
    userSender: UserResponseDto;
    userReceiver: UserResponseDto;
    conversation: SimpleConversationResponseDto;
}
