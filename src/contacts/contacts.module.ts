import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    controllers: [ContactsController],
    providers: [ContactsService],
    imports: [TypeOrmModule.forFeature([Contact]), AuthModule],
    exports: [ContactsService],
})
export class ContactsModule {}
