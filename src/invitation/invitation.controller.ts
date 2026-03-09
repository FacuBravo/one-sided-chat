import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { Auth, GetUserVerified } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';

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

    @Get('/me')
    findAll() {
        return this.invitationService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.invitationService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateInvitationDto: UpdateInvitationDto,
    ) {
        return this.invitationService.update(+id, updateInvitationDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.invitationService.remove(+id);
    }
}
