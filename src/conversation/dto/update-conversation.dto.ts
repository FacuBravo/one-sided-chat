import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateConversationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    description?: string;
}
