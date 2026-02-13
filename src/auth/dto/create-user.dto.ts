import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @ApiProperty({
        description: 'User name',
        example: 'Name Surname',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    fullName: string;

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
        description: 'Username',
        example: 'john_doe',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    username: string;
}
