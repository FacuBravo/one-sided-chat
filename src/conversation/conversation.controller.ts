import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
    Query,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Auth, GetUserVerified } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';
import { PaginationDto } from 'src/utils/dtos/pagination.dto';

@Controller('conversation')
@Auth()
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) {}

    @Post()
    create(
        @GetUserVerified() user: User,
        @Body() createConversationDto: CreateConversationDto,
    ) {
        return this.conversationService.create(user, createConversationDto);
    }

    @Get()
    findAll(@GetUserVerified() user: User) {
        return this.conversationService.findAll(user);
    }

    @Get(':id')
    findAllMessages(
        @GetUserVerified() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Query() paginationDto: PaginationDto,
    ) {
        return this.conversationService.findAllMessages(
            user,
            id,
            paginationDto,
        );
    }

    @Patch(':id/mark-as-read/:messageId')
    markAsRead(
        @GetUserVerified() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Param('messageId', ParseUUIDPipe) messageId: string,
    ) {
        return this.conversationService.markAsRead(user, id, messageId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateConversationDto: UpdateConversationDto,
    ) {
        return this.conversationService.update(id, updateConversationDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @GetUserVerified() user: User) {
        return this.conversationService.remove(id, user);
    }
}
