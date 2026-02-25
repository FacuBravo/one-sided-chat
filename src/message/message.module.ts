import { forwardRef, Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationModule } from 'src/conversation/conversation.module';

@Module({
    controllers: [MessageController],
    providers: [MessageService],
    imports: [
        TypeOrmModule.forFeature([Message]),
        AuthModule,
        forwardRef(() => ConversationModule),
    ],
    exports: [MessageService],
})
export class MessageModule {}
