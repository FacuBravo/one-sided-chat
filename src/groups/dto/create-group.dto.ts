import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { BasicPhoneDto } from 'src/auth/dto';

export class CreateGroupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => BasicPhoneDto)
    invitedPhones?: BasicPhoneDto[];

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BasicPhoneDto)
    phones: BasicPhoneDto[];
}
