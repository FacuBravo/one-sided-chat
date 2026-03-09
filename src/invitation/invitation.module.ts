import { forwardRef, Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationModule } from 'src/conversation/conversation.module';
import { ContactsModule } from 'src/contacts/contacts.module';

@Module({
    controllers: [InvitationController],
    providers: [InvitationService],
    imports: [
        TypeOrmModule.forFeature([Invitation]),
        AuthModule,
        forwardRef(() => ConversationModule),
        ContactsModule,
    ],
    exports: [InvitationService],
})
export class InvitationModule {}
