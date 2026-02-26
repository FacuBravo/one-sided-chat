import { UserResponseDto } from 'src/auth/dto';

export interface ContactResponseDto {
    id: string;
    name?: string;
    referencedUser: UserResponseDto;
}
