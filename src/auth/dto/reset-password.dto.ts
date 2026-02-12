import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNumber,
    IsPositive,
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'User email',
        example: 'name@email.com',
        required: true,
        uniqueItems: true,
    })
    @IsEmail()
    email: string;

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

    @ApiProperty({
        description: 'Verification code',
        example: '123456',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    code: number;

    @ApiProperty({
        description: 'Hashed verification code',
    })
    @IsString()
    @IsNotEmpty()
    hashedCode: string;
}
