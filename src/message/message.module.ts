import { forwardRef, Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationModule } from 'src/conversation/conversation.module';
import { SocketModule } from 'src/socket/socket.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ContactsModule } from 'src/contacts/contacts.module';

@Module({
    controllers: [MessageController],
    providers: [MessageService],
    imports: [
        TypeOrmModule.forFeature([Message]),
        AuthModule,
        forwardRef(() => ConversationModule),
        SocketModule,
        NotificationsModule,
        ContactsModule,
    ],
    exports: [MessageService],
})
export class MessageModule {}
