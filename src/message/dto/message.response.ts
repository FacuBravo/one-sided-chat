import { UserResponseDto } from 'src/auth/dto';

export interface MessageResponseDto {
    id: string;
    seq: number;
    text: string;
    createdAt: Date;
    userSender: UserResponseDto;
}
