import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { GroupsModule } from 'src/groups/groups.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    controllers: [ChatsController],
    providers: [ChatsService],
    imports: [TypeOrmModule.forFeature([Chat]), GroupsModule, AuthModule],
})
export class ChatsModule {}
