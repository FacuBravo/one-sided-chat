import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Invitation } from './entities/invitation.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    controllers: [ConversationController],
    providers: [ConversationService],
    imports: [TypeOrmModule.forFeature([Conversation, Invitation]), AuthModule],
    exports: [ConversationService],
})
export class ConversationModule {}
