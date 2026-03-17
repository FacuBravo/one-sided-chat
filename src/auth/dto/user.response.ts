import { ParticipantRole } from 'src/conversation/entities/conversation_participants.entity';

export interface UserResponseDto {
    id: string;
    fullName: string;
    username: string;
}

export interface ConversationUserDto extends UserResponseDto {
    role: ParticipantRole;
    isDeleted: boolean;
    participantId: string;
}
