import { ContactResponseDto } from 'src/contacts/dto/contact.response';
import { UserResponseDto } from '../dto';
import { User } from '../entities/user.entity';

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
