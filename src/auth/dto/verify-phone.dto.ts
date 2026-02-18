import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { BasicPhoneDto } from './create-user.dto';

export class VerifyPhoneDto extends BasicPhoneDto {
    @ApiProperty({
        description: 'Verification code',
        example: '123456',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(6)
    @MinLength(6)
    code: string;
}
