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
import { In, Not, Raw, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { handleErrors } from 'src/utils/functions';
import { ConversationService } from 'src/conversation/conversation.service';
import { MessageResponseDto } from './dto/message.response';
import { ConversationResponseDto } from 'src/conversation/dto/conversation.response';
import { messagesMapper } from './mappers/messages.mapper';
import { PaginationResponse } from 'src/utils/dtos/pagination-response';

@Injectable()
export class MessageService {
    private readonly logger = new Logger('MessageService');

    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
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

            return savedMessage;
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
        offset: number = 0,
        limit: number = 30,
    ): Promise<PaginationResponse<MessageResponseDto>> {
        const [messages, total] = await this.messageRepository.findAndCount({
            where: { conversation: { id: conversationId } },
            order: { createdAt: 'DESC' },
            relations: ['userSender'],
            skip: offset,
            take: limit,
        });

        return {
            data: messagesMapper(messages),
            total,
            isLast: total <= offset + limit,
            page: Math.floor(offset / limit),
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
