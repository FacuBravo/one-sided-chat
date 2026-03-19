import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { User } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Raw, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { handleErrors } from 'src/utils/functions';
import { ConversationService } from 'src/conversation/conversation.service';
import { MessageResponseDto } from './dto/message.response';
import { ConversationResponseDto } from 'src/conversation/dto/conversation.response';
import { messagesMapper } from './mappers/messages.mapper';
import { PaginationResponse } from 'src/utils/dtos/pagination-response';
import { SocketGateway } from 'src/socket/socket.gateway';
import { AuthService } from 'src/auth/auth.service';
import { NotificationService } from 'src/notifications/notifications.service';
import { ContactsService } from 'src/contacts/contacts.service';
import { notificationsChannels } from 'src/notifications/consts/notifications';

@Injectable()
export class MessageService {
    private readonly logger = new Logger('MessageService');

    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
        private readonly socketGateway: SocketGateway,
        private readonly authService: AuthService,
        private readonly notificationService: NotificationService,
        private readonly contactsService: ContactsService,
    ) {}

    async create(user: User, createMessageDto: CreateMessageDto) {
        try {
            const { text, phones, conversationId } = createMessageDto;
            let conversation: ConversationResponseDto;

            if ((!phones || !phones.length) && !conversationId) {
                throw new BadRequestException(
                    'No phones or conversation id provided',
                );
            }

            if (phones && phones.length && conversationId) {
                throw new BadRequestException(
                    'You cannot send a message to a conversation and a phone at the same time',
                );
            }

            if (conversationId) {
                conversation =
                    await this.conversationService.findOne(conversationId);

                if (
                    conversation.usersSenders.findIndex(
                        (userSender) => userSender.id === user.id,
                    ) === -1
                ) {
                    throw new BadRequestException(
                        'You are not a sender of this conversation',
                    );
                }
            } else {
                conversation = await this.conversationService.create(user, {
                    phonesReceivers: phones!,
                });
            }

            const message = this.messageRepository.create({
                text,
                userSender: user,
                conversation: { id: conversation.id },
                seq: Number(conversation.lastMessageSeq) + 1,
            });

            const savedMessage = await this.messageRepository.save(message);

            await this.conversationService.updateLastMessage(
                conversation.id,
                savedMessage.id,
                Number(conversation.lastMessageSeq) + 1,
            );

            const mappedMessage = messagesMapper([savedMessage])[0];

            const usersReceivers = [
                ...conversation.usersReceivers
                    .filter((u) => !u.isDeleted)
                    .map((u) => u.id),
                ...conversation.usersSenders
                    .filter((u) => !u.isDeleted && u.id !== user.id)
                    .map((u) => u.id),
            ];

            try {
                this.socketGateway.wss
                    .to(usersReceivers.map((u) => `user:${u}`))
                    .emit(notificationsChannels.messages, {
                        conversationId: conversation.id,
                        message: mappedMessage,
                    });
            } catch (error) {
                console.log(error);
            }

            try {
                const usersReceiversIdsAndTokens =
                    await this.authService.getPushTokens(usersReceivers);

                const contacts =
                    await this.contactsService.findByReferencedUser(
                        usersReceiversIdsAndTokens.map((u) => u.id),
                        user.id,
                    );

                this.notificationService.sendMessagePush({
                    tokens: usersReceiversIdsAndTokens.map((u) => u.pushToken),
                    titles: usersReceiversIdsAndTokens.map(
                        (u, i) => contacts[i]?.name || user.fullName,
                    ),
                    body: text.split('\n')[0].slice(0, 50),
                    data: {
                        conversationId: conversation.id,
                        message: mappedMessage,
                    },
                });
            } catch (error) {
                console.log(error);
            }

            return mappedMessage;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findOneByIdAndConversation(
        id: string,
        conversationId: string,
    ): Promise<MessageResponseDto> {
        const message = await this.messageRepository.findOne({
            where: {
                id,
                conversation: { id: conversationId },
            },
            relations: ['userSender'],
        });

        if (!message) {
            throw new BadRequestException('Message not found');
        }

        return messagesMapper([message])[0];
    }

    async findByIds(ids: string[]): Promise<MessageResponseDto[]> {
        const messages = await this.messageRepository.find({
            where: { id: In(ids) },
            relations: ['userSender'],
        });

        return messagesMapper(messages);
    }

    async findAllByConversationId(
        conversationId: string,
        beforeSeq: number,
        limit: number = 30,
    ): Promise<PaginationResponse<MessageResponseDto>> {
        const [messages, total] = await this.messageRepository.findAndCount({
            where: {
                conversation: { id: conversationId },
                seq: LessThan(beforeSeq),
            },
            order: { seq: 'DESC' },
            relations: ['userSender'],
            take: limit,
        });

        return {
            data: messagesMapper(messages),
            nextCursor: messages.length
                ? messages[messages.length - 1].seq
                : null,
            isLast: messages.length < limit,
        };
    }

    update(id: string, updateMessageDto: UpdateMessageDto) {
        return `This action updates a #${id} message`;
    }

    countUnreadMessages(user: User, conversationId: string, seq: number) {
        return this.messageRepository.count({
            where: {
                conversation: { id: conversationId },
                userSender: { id: Not(user.id) },
                seq: Raw((alias) => `${alias} > ${seq}`),
            },
        });
    }

    remove(id: string) {
        return `This action removes a #${id} message`;
    }
}
