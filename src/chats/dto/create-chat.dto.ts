import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { BasicPhoneDto } from 'src/auth/dto';

export class CreateChatDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => BasicPhoneDto)
    phones?: BasicPhoneDto[];

    @IsUUID()
    @IsOptional()
    groupId?: string;
}
