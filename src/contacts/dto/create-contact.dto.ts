import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNotEmptyObject,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { BasicPhoneDto } from 'src/auth/dto';

export class CreateContactDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => BasicPhoneDto)
    phone: BasicPhoneDto;
}
