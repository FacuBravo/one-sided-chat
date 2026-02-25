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
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { handleErrors } from 'src/utils/functions';
import { ConversationService } from 'src/conversation/conversation.service';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { MessageResponseDto } from './dto/message.response';

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
            let conversation: Conversation;

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
            } else {
                conversation = await this.conversationService.create(user, {
                    phonesReceivers: phones!,
                });
            }

            const message = this.messageRepository.create({
                text,
                userSender: user,
                conversation: conversation,
                readBy: [],
            });

            const savedMessage = await this.messageRepository.save(message);

            await this.conversationService.updateLastMessage(
                conversation.id,
                savedMessage.id,
            );

            return savedMessage;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    findAll() {
        return `This action returns all message`;
    }

    async findOne(id: string): Promise<MessageResponseDto> {
        const message = await this.messageRepository.findOneBy({ id });

        if (!message) {
            throw new BadRequestException('Message not found');
        }

        return message;
    }

    update(id: string, updateMessageDto: UpdateMessageDto) {
        return `This action updates a #${id} message`;
    }

    remove(id: string) {
        return `This action removes a #${id} message`;
    }
}
