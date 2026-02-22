import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ForbiddenException,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';

@Controller('chats')
@Auth()
export class ChatsController {
    constructor(private readonly chatsService: ChatsService) {}

    @Post()
    create(@GetUser() user: User, @Body() createChatDto: CreateChatDto) {
        if (!user.phoneVerified) {
            throw new ForbiddenException('Phone not verified');
        }

        return this.chatsService.create(user, createChatDto);
    }

    @Get()
    findAll() {
        return this.chatsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.chatsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
        return this.chatsService.update(+id, updateChatDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.chatsService.remove(+id);
    }
}
