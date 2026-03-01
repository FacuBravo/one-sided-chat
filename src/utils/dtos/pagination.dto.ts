import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
    @ApiProperty({
        default: 10,
        description: 'How many records do you want to load',
    })
    @IsOptional()
    @IsPositive()
    @IsInt()
    @Type(() => Number)
    limit?: number;

    @ApiProperty({
        default: 0,
        description: 'How many records do you want to skip',
    })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    offset?: number;
}
