import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsArray,
    IsOptional,
    ValidateNested,
    IsUUID,
    ArrayNotEmpty,
} from 'class-validator';
import { BasicPhoneDto } from 'src/auth/dto';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => BasicPhoneDto)
    phones?: BasicPhoneDto[];

    @IsUUID()
    @IsOptional()
    conversationId?: string;
}
