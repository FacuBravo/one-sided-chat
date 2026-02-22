import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';

@Module({
    controllers: [ChatsController],
    providers: [ChatsService],
    imports: [TypeOrmModule.forFeature([Chat])],
})
export class ChatsModule {}
