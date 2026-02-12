import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class LoginUserDto {
    @ApiProperty({
        description: 'User phone',
        example: '1234567890',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    @MinLength(11)
    phone: string;

    @ApiProperty({
        description: 'User country code (ISO 3166-1 alpha-2)',
        example: 'AR',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2)
    @MinLength(2)
    countryCode: string;

    @ApiProperty({
        description: 'User password',
        example: '1234Password',
        required: true,
        minLength: 8,
        maxLength: 50,
    })
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
            'The password must have a Uppercase, lowercase letter and a number',
    })
    password: string;
}
