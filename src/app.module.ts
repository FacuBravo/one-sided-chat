import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { TwilioModule } from './utils/sms/twilio.module';
import { ChatsModule } from './chats/chats.module';
import { GroupsModule } from './groups/groups.module';
import { MessageModule } from './message/message.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: +(process.env.DB_PORT + ''),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            // url: process.env.DB_URL,
            autoLoadEntities: true,
            synchronize: true,
        }),
        AuthModule,
        TwilioModule,
        ChatsModule,
        GroupsModule,
        MessageModule,
        ConversationModule,
    ],
})
export class AppModule {}
