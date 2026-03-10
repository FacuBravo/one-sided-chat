import { IsEnum, IsNotEmpty } from 'class-validator';
import { InvitationState } from '../entities/invitation.entity';

export class UpdateInvitationDto {
    @IsNotEmpty()
    @IsEnum(InvitationState)
    state: InvitationState;
}
