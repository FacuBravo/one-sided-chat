import { ApiProperty } from "@nestjs/swagger";

export class LoggedUserResponse {
    @ApiProperty({
        uniqueItems: true,
        description: 'Unique identifier for the header',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'User email',
        example: 'name@email.com',
        uniqueItems: true,
    })
    email: string;

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
        description: 'User logged with',
        example: 'google',
    })
    loggedWith: 'google' | 'regular';
}
