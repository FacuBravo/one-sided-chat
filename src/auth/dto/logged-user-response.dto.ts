import { ApiProperty } from '@nestjs/swagger';

export class LoggedUserResponse {
    @ApiProperty({
        uniqueItems: true,
        description: 'Unique identifier for the header',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'User full name',
        example: 'Name Surname',
    })
    fullName: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+1234567890',
    })
    phone: string;

    @ApiProperty({
        description: 'User country code (ISO 3166-1 alpha-2)',
        example: 'AR',
    })
    country: string;

    @ApiProperty({
        description: 'Token expiration time',
    })
    expires: Date;

    @ApiProperty({
        description: 'Auth token',
        type: 'string',
    })
    token: string;

    @ApiProperty({
        description: 'Refresh token',
        type: 'string',
    })
    refreshToken: string;
}
