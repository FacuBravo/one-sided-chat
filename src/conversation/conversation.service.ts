import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { handleErrors, normalizePhone } from 'src/utils/functions';
import { Invitation } from './entities/invitation.entity';
import { User } from 'src/auth/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { BasicPhoneDto } from 'src/auth/dto';

@Injectable()
export class ConversationService {
    private readonly logger = new Logger('ConversationService');

    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,
        @InjectRepository(Invitation)
        private readonly invitationRepository: Repository<Invitation>,
        private readonly authService: AuthService,
    ) {}

    async create(user: User, createConversationDto: CreateConversationDto) {
        try {
            const { name, description, invitedPhones, phonesReceivers } =
                createConversationDto;

            const type = name
                ? 'group'
                : phonesReceivers.length > 1
                  ? 'list'
                  : 'private';

            let invitedUsers: User[] = [];

            if (invitedPhones) {
                invitedUsers = await this.getUsersByPhones(invitedPhones, user);
            }

            const usersReceivers = await this.getUsersByPhones(
                phonesReceivers,
                user,
            );

            const conversation = this.conversationRepository.create({
                name,
                description,
                type,
                usersSenders: [user],
                usersReceivers,
            });

            const savedConversation =
                await this.conversationRepository.save(conversation);

            if (invitedUsers.length) {
                const invitations = invitedUsers.map((userReceiver) =>
                    this.invitationRepository.create({
                        conversation: savedConversation,
                        userSender: user,
                        userReceiver,
                    }),
                );

                await this.invitationRepository.save(invitations);
            }

            return savedConversation;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    findAll() {
        return `This action returns all conversation`;
    }

    async findOne(id: string) {
        const conversation = await this.conversationRepository.findOneBy({
            id,
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    update(id: string, updateConversationDto: UpdateConversationDto) {
        return `This action updates a #${id} conversation`;
    }

    async updateLastMessage(id: string, lastMessageId: string) {
        try {
            const res = await this.conversationRepository.update(id, {
                lastMessageId,
            });

            return res.affected;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    remove(id: string) {
        return `This action removes a #${id} conversation`;
    }

    private async getUsersByPhones(phones: BasicPhoneDto[], user: User) {
        if (phones.find((phone) => phone.phone === user.phone_e164)) {
            throw new BadRequestException(
                'You cannot send a message to yourself',
            );
        }

        const phonesE164Array = phones.map((item) => item.phone);

        const isDuplicate = phonesE164Array.some(
            (item, index) => phonesE164Array.indexOf(item) !== index,
        );

        if (isDuplicate) {
            throw new BadRequestException('Duplicate phone numbers found');
        }

        const phones_e164 = phones.map(
            (phone) =>
                normalizePhone(phone.phone, phone.countryCode).phone_e164,
        );

        return await this.authService.getUsersByPhones(phones_e164);
    }
}
