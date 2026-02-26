import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNotEmptyObject,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { BasicPhoneDto } from 'src/auth/dto';

export class CreateContactDto {
    @IsString()
    @IsOptional()
    @MaxLength(50)
    name?: string;

    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => BasicPhoneDto)
    phone: BasicPhoneDto;
}
