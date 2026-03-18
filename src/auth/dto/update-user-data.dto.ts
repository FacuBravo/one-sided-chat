import { ApiProperty, PartialType } from '@nestjs/swagger';
import { BasicPhoneDto } from './create-user.dto';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDataDto extends PartialType(BasicPhoneDto) {
    @ApiProperty({
        description: 'User name',
        example: 'Name Surname',
        required: true,
    })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    fullName?: string;
}

export class UpdatePushTokenDto {
    @ApiProperty({
        description: 'User push token',
        example: '1234567890',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    pushToken: string;
}
