import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Auth, GetUserVerified } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';

@Controller('message')
@Auth()
export class MessageController {
    constructor(private readonly messageService: MessageService) {}

    @Post()
    create(
        @GetUserVerified() user: User,
        @Body() createMessageDto: CreateMessageDto,
    ) {
        return this.messageService.create(user, createMessageDto);
    }

    @Get()
    findAll() {
        return this.messageService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.messageService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateMessageDto: UpdateMessageDto,
    ) {
        return this.messageService.update(+id, updateMessageDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.messageService.remove(+id);
    }
}
