import { ContactResponseDto } from 'src/contacts/dto/contact.response';
import { ConversationUserDto, UserResponseDto } from '../dto';
import { User } from '../entities/user.entity';
import {
    ConversationParticipant,
    ParticipantRole,
    ParticipantType,
} from 'src/conversation/entities/conversation_participants.entity';

export const usersMapper = (
    users: User[],
    contacts?: ContactResponseDto[],
): UserResponseDto[] => {
    return users.map((user) => {
        const contact = contacts?.find((c) => c.referencedUser.id === user.id);

        return {
            id: user.id,
            fullName: contact ? contact.name || user.fullName : user.fullName,
            username: user.username,
        };
    });
};

export const conversationUsersMapper = (
    users: User[],
    participants: ConversationParticipant[],
    type: ParticipantType,
    contacts?: ContactResponseDto[],
): ConversationUserDto[] => {
    return users.map((user) => {
        const contact = contacts?.find((c) => c.referencedUser.id === user.id);
        const participant = participants.find(
            (p) => p.user.id === user.id && p.type === type,
        );

        return {
            id: user.id,
            fullName: contact ? contact.name || user.fullName : user.fullName,
            username: user.username,
            role: participant?.role || ParticipantRole.USER,
            isDeleted: participant?.isDeleted || false,
            participantId: participant?.id || '',
            color: participant?.color,
        };
    });
};
