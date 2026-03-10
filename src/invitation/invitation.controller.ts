import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
    ParseEnumPipe,
    ParseBoolPipe,
    Query,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { Auth, GetUserVerified } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';
import { InvitationState } from './entities/invitation.entity';

@Controller('invitation')
@Auth()
export class InvitationController {
    constructor(private readonly invitationService: InvitationService) {}

    @Post('/conversation/:conversationId')
    create(
        @GetUserVerified() user: User,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
        @Body() createInvitationDto: CreateInvitationDto,
    ) {
        return this.invitationService.create(
            user,
            conversationId,
            createInvitationDto,
        );
    }

    @Get('/me/:state')
    findAllByState(
        @GetUserVerified() user: User,
        @Param('state', new ParseEnumPipe(InvitationState))
        state: InvitationState,
        @Query('exclude', ParseBoolPipe) exclude: boolean,
    ) {
        return this.invitationService.findAllByState(user, state, exclude);
    }

    @Patch(':id')
    answer(
        @Param('id', ParseUUIDPipe) id: string,
        @GetUserVerified() user: User,
        @Body() updateInvitationDto: UpdateInvitationDto,
    ) {
        return this.invitationService.answer(user, id, updateInvitationDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.invitationService.remove(+id);
    }
}
