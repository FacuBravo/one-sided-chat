import { UserResponseDto } from '../dto';
import { User } from '../entities/user.entity';

export const usersMapper = (users: User[]): UserResponseDto[] => {
    return users.map((user) => {
        return {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
        };
    });
};
