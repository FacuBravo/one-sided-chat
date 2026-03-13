import { Type } from 'class-transformer';
import {
    IsString,
    IsOptional,
    MaxLength,
    IsNotEmpty,
    IsArray,
    ValidateNested,
    ArrayNotEmpty,
    IsUUID,
    ArrayUnique,
} from 'class-validator';
import { BasicPhoneDto } from 'src/auth/dto';

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

export class AddReceiversDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BasicPhoneDto)
    phones: BasicPhoneDto[];
}

export class RemoveParticipantsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID(undefined, { each: true })
    @ArrayUnique()
    userIds: string[];
}
