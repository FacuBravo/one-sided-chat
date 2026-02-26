import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Auth, GetUserVerified } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';

@Controller('contacts')
@Auth()
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) {}

    @Post()
    create(
        @GetUserVerified() user: User,
        @Body() createContactDto: CreateContactDto,
    ) {
        return this.contactsService.create(user, createContactDto);
    }

    @Get()
    findAll(@GetUserVerified() user: User) {
        return this.contactsService.findAll(user);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contactsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateContactDto: UpdateContactDto,
    ) {
        return this.contactsService.update(id, updateContactDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.contactsService.remove(id);
    }
}
