import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class TokenDto {
    @ApiProperty({
        description: 'Auth token',
        required: true,
        type: 'string',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}