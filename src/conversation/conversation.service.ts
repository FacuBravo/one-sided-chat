import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { handleErrors, normalizePhone } from 'src/utils/functions';
import { User } from 'src/auth/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { BasicPhoneDto } from 'src/auth/dto';
import { MessageService } from 'src/message/message.service';
import {
    conversationsMapper,
    fullConversationMapper,
    UnreadMessages,
} from './mappers/conversations.mapper';
import { ContactsService } from 'src/contacts/contacts.service';
import { PaginationDto } from 'src/utils/dtos/pagination.dto';
import { ConversationRead } from './entities/conversation_read.entity';
import { InvitationService } from 'src/invitation/invitation.service';

@Injectable()
export class ConversationService {
    private readonly logger = new Logger('ConversationService');

    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,
        @InjectRepository(ConversationRead)
        private readonly conversationReadRepository: Repository<ConversationRead>,
        private readonly authService: AuthService,
        @Inject(forwardRef(() => MessageService))
        private readonly messageService: MessageService,
        private readonly contactsService: ContactsService,
        @Inject(forwardRef(() => InvitationService))
        private readonly invitationService: InvitationService,
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
                await this.invitationService.create(
                    user,
                    savedConversation.id,
                    { userReceiverIds: invitedUsers.map((user) => user.id) },
                );
            }

            const receiversIds = savedConversation.usersReceivers
                .flat()
                .map((user) => user.id);

            const contacts = await this.contactsService.findByUsers(
                user,
                receiversIds,
            );

            return conversationsMapper([savedConversation], contacts)[0];
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findAll(user: User) {
        try {
            const conversations = await this.conversationRepository.find({
                relations: ['usersReceivers', 'usersSenders'],
                where: [
                    {
                        usersReceivers: {
                            id: user.id,
                        },
                    },
                    {
                        usersSenders: {
                            id: user.id,
                        },
                    },
                ],
                order: {
                    updatedAt: 'DESC',
                    usersReceivers: {
                        fullName: 'ASC',
                    },
                },
            });

            const lastMessagesIds = conversations
                .map((conversation) => conversation.lastMessageId)
                .filter((id) => id !== undefined);

            const lastMessages =
                await this.messageService.findByIds(lastMessagesIds);

            const receiversIds = conversations
                .map((conversation) => conversation.usersReceivers)
                .flat()
                .map((user) => user.id);

            const sendersIds = conversations
                .map((conversation) => conversation.usersSenders)
                .flat()
                .map((user) => user.id);

            const sendersContacts = await this.contactsService.findByUsers(
                user,
                sendersIds,
            );

            const receiversContacts = await this.contactsService.findByUsers(
                user,
                receiversIds,
            );

            const conversationIds = conversations.map(
                (conversation) => conversation.id,
            );

            const conversationReads = await this.getConversationReads(
                user,
                conversationIds,
            );

            const unreadMessages: UnreadMessages[] = await Promise.all(
                conversations.map(async (c) => {
                    const conversationRead = conversationReads.find(
                        (cr) => cr.conversation.id === c.id,
                    );

                    const count = await this.messageService.countUnreadMessages(
                        user,
                        c.id,
                        conversationRead?.lastReadSeq || 0,
                    );

                    return {
                        conversationId: c.id,
                        count,
                    };
                }),
            );

            return conversationsMapper(
                conversations,
                receiversContacts,
                sendersContacts,
                lastMessages,
                unreadMessages,
            );
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findAllMessages(
        user: User,
        id: string,
        paginationDto: PaginationDto,
    ) {
        try {
            const conversation = await this.conversationRepository.findOne({
                where: { id },
                relations: ['usersReceivers', 'usersSenders'],
                order: {
                    usersReceivers: {
                        fullName: 'ASC',
                    },
                },
            });

            if (!conversation) {
                throw new NotFoundException('Conversation not found');
            }

            const receiversIds = conversation.usersReceivers
                .flat()
                .map((user) => user.id);

            const sendersIds = conversation.usersSenders
                .flat()
                .map((user) => user.id);

            if (
                !receiversIds.includes(user.id) &&
                !sendersIds.includes(user.id)
            ) {
                throw new NotFoundException('Conversation not found');
            }

            const sendersContacts = await this.contactsService.findByUsers(
                user,
                sendersIds,
            );

            const receiversContacts = await this.contactsService.findByUsers(
                user,
                receiversIds,
            );

            const messages = await this.messageService.findAllByConversationId(
                id,
                paginationDto.offset,
                paginationDto.limit,
            );

            const conversationRead =
                await this.conversationReadRepository.findOne({
                    where: {
                        conversation: { id },
                        user: { id: user.id },
                    },
                });

            const unreadCount = await this.messageService.countUnreadMessages(
                user,
                conversation.id,
                conversationRead?.lastReadSeq || 0,
            );

            return fullConversationMapper(
                conversation,
                messages,
                receiversContacts,
                sendersContacts,
                unreadCount,
            );
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findOne(id: string) {
        const conversation = await this.conversationRepository.findOne({
            where: {
                id,
            },
            relations: ['usersReceivers', 'usersSenders'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversationsMapper([conversation])[0];
    }

    update(id: string, updateConversationDto: UpdateConversationDto) {
        return `This action updates a #${id} conversation`;
    }

    async addInvitedUser(conversationId: string, invitedUser: User) {
        try {
            const conversation = await this.findOneRaw(conversationId);

            conversation.usersSenders.push(invitedUser);

            return this.conversationRepository.save(conversation);
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async updateLastMessage(
        id: string,
        lastMessageId: string,
        lastMessageSeq: number,
    ) {
        try {
            const res = await this.conversationRepository.update(id, {
                lastMessageId,
                updatedAt: new Date(),
                lastMessageSeq,
            });

            return res.affected;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async markAsRead(user: User, id: string, messageId: string) {
        try {
            const message =
                await this.messageService.findOneByIdAndConversation(
                    messageId,
                    id,
                );
            const conversation = await this.findOne(id);

            if (
                conversation.usersReceivers.findIndex(
                    (u) => u.id === user.id,
                ) === -1 &&
                conversation.usersSenders.findIndex((u) => u.id === user.id) ===
                    -1
            ) {
                throw new NotFoundException('Conversation not found');
            }

            await this.conversationReadRepository.upsert(
                {
                    conversation: { id },
                    user: { id: user.id },
                    lastReadSeq: message.seq,
                },
                ['conversation', 'user'],
            );

            return true;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async remove(id: string, user: User) {
        try {
            const conversation = await this.findOneRaw(id);

            const receiversIds = conversation.usersReceivers
                .flat()
                .map((user) => user.id);

            const sendersIds = conversation.usersSenders
                .flat()
                .map((user) => user.id);

            if (
                !receiversIds.includes(user.id) &&
                !sendersIds.includes(user.id)
            ) {
                throw new NotFoundException('Conversation not found');
            }

            if (sendersIds.includes(user.id)) {
                conversation.usersSenders = conversation.usersSenders.filter(
                    (u) => u.id !== user.id,
                );
            }

            if (receiversIds.includes(user.id)) {
                conversation.usersReceivers =
                    conversation.usersReceivers.filter((u) => u.id !== user.id);
            }

            if (
                conversation.usersReceivers.length === 0 &&
                conversation.usersSenders.length === 0
            ) {
                await this.conversationRepository.remove(conversation);
            } else {
                await this.conversationRepository.save(conversation);
            }

            return true;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    private async findOneRaw(id: string) {
        const conversation = await this.conversationRepository.findOne({
            where: {
                id,
            },
            relations: ['usersReceivers', 'usersSenders'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    private getConversationReads(user: User, conversationIds: string[]) {
        return this.conversationReadRepository.find({
            where: {
                conversation: { id: In(conversationIds) },
                user: {
                    id: user.id,
                },
            },
            relations: ['conversation', 'user'],
        });
    }

    private getUsersByPhones(phones: BasicPhoneDto[], user: User) {
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

        return this.authService.getUsersByPhones(phones_e164);
    }
}
