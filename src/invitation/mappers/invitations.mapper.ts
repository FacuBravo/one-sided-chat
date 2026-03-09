import { usersMapper } from 'src/auth/mappers/user.mapper';
import { Invitation } from '../entities/invitation.entity';
import { InvitationResponseDto } from '../dto/invitation.response';
import { simpleConversationsMapper } from 'src/conversation/mappers/conversations.mapper';
import { ContactResponseDto } from 'src/contacts/dto/contact.response';

export const invitationsMapper = (
    invitations: Invitation[],
    contactsSenders: ContactResponseDto[] = [],
): InvitationResponseDto[] => {
    return invitations.map((invitation) => ({
        id: invitation.id,
        state: invitation.state,
        createdAt: invitation.createdAt,
        solvedAt: invitation.solvedAt,
        userSender: usersMapper([invitation.userSender], contactsSenders)[0],
        userReceiver: usersMapper([invitation.userReceiver])[0],
        conversation: simpleConversationsMapper([invitation.conversation])[0],
    }));
};
