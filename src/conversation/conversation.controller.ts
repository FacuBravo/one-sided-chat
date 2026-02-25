import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Auth, GetUserVerified } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';

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
    findAll() {
        return this.conversationService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.conversationService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateConversationDto: UpdateConversationDto,
    ) {
        return this.conversationService.update(id, updateConversationDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.conversationService.remove(id);
    }
}
