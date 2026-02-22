import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from 'class-validator';
import { BasicPhoneDto } from 'src/auth/dto';

export class CreateChatDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BasicPhoneDto)
    phones: BasicPhoneDto[];

    @IsBoolean()
    createGroup: boolean;
}
