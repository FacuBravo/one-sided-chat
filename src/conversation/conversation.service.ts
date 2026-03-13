import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import {
    AddReceiversDto,
    RemoveParticipantsDto,
    UpdateConversationDto,
} from './dto/update-conversation.dto';
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
import {
    ConversationParticipant,
    ParticipantRole,
    ParticipantType,
} from './entities/conversation_participants.entity';

@Injectable()
export class ConversationService {
    private readonly logger = new Logger('ConversationService');

    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,
        @InjectRepository(ConversationRead)
        private readonly conversationReadRepository: Repository<ConversationRead>,
        @InjectRepository(ConversationParticipant)
        private readonly conversationParticipantRepository: Repository<ConversationParticipant>,
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

            const conversation = this.conversationRepository.create({
                name,
                description,
                type,
            });

            const savedConversation =
                await this.conversationRepository.save(conversation);

            const usersReceivers = await this.getUsersByPhones(
                phonesReceivers,
                user,
            );

            await this.conversationParticipantRepository.save(
                [
                    usersReceivers.map((user) => ({
                        conversation: savedConversation,
                        user,
                        type: ParticipantType.RECEIVER,
                    })),
                    {
                        conversation: savedConversation,
                        user,
                        type: ParticipantType.SENDER,
                        role: ParticipantRole.ADMIN,
                    },
                ].flat(),
            );

            if (invitedUsers.length) {
                await this.invitationService.create(
                    user,
                    savedConversation.id,
                    { userReceiverIds: invitedUsers.map((user) => user.id) },
                );
            }

            const receiversIds = usersReceivers.flat().map((user) => user.id);

            const contacts = await this.contactsService.findByUsers(
                user,
                receiversIds,
            );

            const newConversation = await this.findOneRaw(savedConversation.id);

            return conversationsMapper([newConversation], contacts)[0];
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findAll(user: User) {
        try {
            const conversations = await this.conversationRepository
                .createQueryBuilder('conversation')
                .leftJoinAndSelect('conversation.participants', 'participants')
                .leftJoinAndSelect('participants.user', 'user')
                .where((qb) => {
                    const sub = qb
                        .subQuery()
                        .select('1')
                        .from(ConversationParticipant, 'cp')
                        .where('cp.conversationId = conversation.id')
                        .andWhere('cp.userId = :userId')
                        .andWhere('cp.isDeleted = false')
                        .getQuery();

                    return `EXISTS ${sub}`;
                })
                .setParameter('userId', user.id)
                .orderBy('conversation.updatedAt', 'DESC')
                .getMany();

            const lastMessagesIds = conversations
                .map((conversation) => conversation.lastMessageId)
                .filter((id) => id !== undefined);

            const lastMessages =
                await this.messageService.findByIds(lastMessagesIds);

            const receiversIds = conversations
                .map((conversation) => conversation.participants)
                .flat()
                .filter(
                    (participant) =>
                        participant.type === ParticipantType.RECEIVER,
                )
                .map((participant) => participant.user.id);

            const sendersIds = conversations
                .map((conversation) => conversation.participants)
                .flat()
                .filter(
                    (participant) =>
                        participant.type === ParticipantType.SENDER,
                )
                .map((participant) => participant.user.id);

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
                relations: ['participants', 'participants.user'],
                order: {
                    participants: {
                        user: {
                            fullName: 'ASC',
                        },
                    },
                },
            });

            if (!conversation) {
                throw new NotFoundException('Conversation not found');
            }

            const receiversIds = conversation.participants
                .filter(
                    (participant) =>
                        participant.type === ParticipantType.RECEIVER,
                )
                .map((participant) => participant.user.id);

            const sendersIds = conversation.participants
                .filter(
                    (participant) =>
                        participant.type === ParticipantType.SENDER,
                )
                .map((participant) => participant.user.id);

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
            relations: ['participants', 'participants.user'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversationsMapper([conversation])[0];
    }

    async update(
        id: string,
        updateConversationDto: UpdateConversationDto,
        user: User,
    ) {
        try {
            const conversation = await this.findOneRaw(id);

            const participant = conversation.participants.find(
                (p) => p.user.id === user.id,
            );

            if (!participant) {
                throw new NotFoundException('Conversation not found');
            }

            if (conversation.type !== 'group') {
                throw new BadRequestException('Conversation is not a group');
            }

            if (participant.role !== ParticipantRole.ADMIN) {
                throw new ForbiddenException(
                    'You are not admin of this conversation',
                );
            }

            const res = await this.conversationRepository.update(
                id,
                updateConversationDto,
            );

            return res.affected === 1;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async addInvitedUser(conversationId: string, invitedUser: User) {
        try {
            const conversation = await this.findOneRaw(conversationId);

            return await this.conversationParticipantRepository.save({
                conversation,
                user: invitedUser,
                type: ParticipantType.SENDER,
            });
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

            const participantsIds = conversation.participants.map(
                (participant) => participant.user.id,
            );

            if (!participantsIds.includes(user.id)) {
                throw new NotFoundException('Conversation not found');
            }

            await this.conversationParticipantRepository.update(
                {
                    conversation: { id },
                    user: { id: user.id },
                },
                {
                    isDeleted: true,
                },
            );

            conversation.participants = conversation.participants.map(
                (participant) => {
                    if (participant.user.id === user.id) {
                        return {
                            ...participant,
                            isDeleted: true,
                        };
                    }

                    return participant;
                },
            );

            if (
                conversation.participants.findIndex((p) => !p.isDeleted) === -1
            ) {
                await this.conversationRepository.remove(conversation);
            }

            return true;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async addReceivers(
        id: string,
        addReceiversDto: AddReceiversDto,
        user: User,
    ) {
        try {
            const conversation = await this.findOneRaw(id);

            const participant = conversation.participants.find(
                (p) => p.user.id === user.id,
            );

            if (!participant) {
                throw new NotFoundException('Conversation not found');
            }

            if (participant.role !== ParticipantRole.ADMIN) {
                throw new ForbiddenException(
                    'You are not admin of this conversation',
                );
            }

            const users = await this.getUsersByPhones(
                addReceiversDto.phones,
                user,
            );

            if (users.length !== addReceiversDto.phones.length) {
                throw new NotFoundException('Users not found');
            }

            const userAlreadyInConversation = conversation.participants.find(
                (p) =>
                    users.find(
                        (u) =>
                            u.id === p.user.id &&
                            !p.isDeleted &&
                            p.type === ParticipantType.RECEIVER,
                    ),
            );

            if (userAlreadyInConversation) {
                throw new BadRequestException('User already in conversation');
            }

            await this.conversationParticipantRepository.save(
                users.map((user) => ({
                    conversation,
                    user,
                    type: ParticipantType.RECEIVER,
                })),
            );

            return true;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async removeParticipants(
        id: string,
        removeParticipantsDto: RemoveParticipantsDto,
        user: User,
    ) {
        try {
            const { userIds } = removeParticipantsDto;

            if (userIds.includes(user.id)) {
                throw new BadRequestException('You cannot remove yourself');
            }

            const conversation = await this.findOneRaw(id);

            const participant = conversation.participants.find(
                (p) => p.user.id === user.id,
            );

            if (!participant) {
                throw new NotFoundException('Conversation not found');
            }

            if (participant.role !== ParticipantRole.ADMIN) {
                throw new ForbiddenException(
                    'You are not admin of this conversation',
                );
            }

            const participantsToRemove = conversation.participants.filter(
                (p) => userIds.includes(p.user.id) && !p.isDeleted,
            );

            if (participantsToRemove.length === 0) {
                throw new BadRequestException('No participants to remove');
            }

            const receiversCount = conversation.participants.filter(
                (p) => p.type === ParticipantType.RECEIVER && !p.isDeleted,
            ).length;

            const receiversCountToRemove = participantsToRemove.filter(
                (p) => p.type === ParticipantType.RECEIVER,
            ).length;

            if (receiversCount - receiversCountToRemove < 2) {
                throw new BadRequestException(
                    'Group must have at least 2 receivers',
                );
            }

            await this.conversationParticipantRepository.update(
                {
                    conversation: { id },
                    user: {
                        id: In(userIds),
                    },
                },
                {
                    isDeleted: true,
                },
            );

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
            relations: ['participants', 'participants.user'],
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
