import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'User old password',
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
    oldPassword: string;

    @ApiProperty({
        description: 'User new password',
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
    newPassword: string;
}
