import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { BasicPhoneDto } from 'src/auth/dto';

export class CreateConversationDto {
    @IsString()
    @IsOptional()
    @MaxLength(50)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    description?: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => BasicPhoneDto)
    invitedPhones?: BasicPhoneDto[];

    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BasicPhoneDto)
    phonesReceivers: BasicPhoneDto[];
}
