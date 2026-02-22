import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Repository } from 'typeorm';
import { GroupsService } from 'src/groups/groups.service';
import { User } from 'src/auth/entities/user.entity';
import { handleErrors, normalizePhone } from 'src/utils/functions';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ChatsService {
    private readonly logger = new Logger('ChatsService');

    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        private readonly groupsService: GroupsService,
        private readonly authService: AuthService,
    ) {}

    async create(userSender: User, createChatDto: CreateChatDto) {
        try {
            const { message, createGroup, phones } = createChatDto;

            if (phones.find((phone) => phone.phone === userSender.phone_e164)) {
                throw new BadRequestException(
                    'You cannot send a message to yourself',
                );
            }

            const phonesE164Array = phones.map(function (item) {
                return item.phone;
            });

            const isDuplicate = phonesE164Array.some(
                (item, index) => phonesE164Array.indexOf(item) !== index,
            );

            if (isDuplicate) {
                throw new BadRequestException('Duplicate phone numbers found');
            }

            let usersReceivers: User[] = [];

            if (!createGroup) {
                const phones_e164 = phones.map(
                    (phone) =>
                        normalizePhone(phone.phone, phone.countryCode)
                            .phone_e164,
                );

                usersReceivers =
                    await this.authService.getUsersByPhones(phones_e164);
            }

            const chat = this.chatRepository.create({
                message,
                userSender,
                usersReceivers,
                isRead: Array.from(
                    { length: usersReceivers.length },
                    () => false,
                ),
            });

            return await this.chatRepository.save(chat);
        } catch (error) {
            handleErrors(this.logger, error);
        }
    }

    findAll() {
        return `This action returns all chats`;
    }

    findOne(id: number) {
        return `This action returns a #${id} chat`;
    }

    update(id: number, updateChatDto: UpdateChatDto) {
        return `This action updates a #${id} chat`;
    }

    remove(id: number) {
        return `This action removes a #${id} chat`;
    }
}
