import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreateInvitationDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID(undefined, { each: true })
    userReceiverIds: string[];
}
