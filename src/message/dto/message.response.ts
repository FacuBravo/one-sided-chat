import { UserResponseDto } from 'src/auth/dto';

export interface MessageResponseDto {
    id: string;
    text: string;
    createdAt: Date;
    readBy: string[];
    userSender: UserResponseDto;
}
