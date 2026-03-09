import { forwardRef, Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { AuthModule } from 'src/auth/auth.module';
import { MessageModule } from 'src/message/message.module';
import { ContactsModule } from 'src/contacts/contacts.module';
import { ConversationRead } from './entities/conversation_read.entity';
import { InvitationModule } from 'src/invitation/invitation.module';

@Module({
    controllers: [ConversationController],
    providers: [ConversationService],
    imports: [
        TypeOrmModule.forFeature([Conversation, ConversationRead]),
        AuthModule,
        forwardRef(() => MessageModule),
        ContactsModule,
        forwardRef(() => InvitationModule),
    ],
    exports: [ConversationService],
})
export class ConversationModule {}
