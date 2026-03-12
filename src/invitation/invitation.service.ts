import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Invitation, InvitationState } from './entities/invitation.entity';
import { User } from 'src/auth/entities/user.entity';
import { handleErrors } from 'src/utils/functions';
import { ConversationService } from 'src/conversation/conversation.service';
import { ContactsService } from 'src/contacts/contacts.service';
import { invitationsMapper } from './mappers/invitations.mapper';

@Injectable()
export class InvitationService {
    private readonly logger = new Logger('InvitationService');

    constructor(
        @InjectRepository(Invitation)
        private readonly invitationRepository: Repository<Invitation>,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
        private readonly contactsService: ContactsService,
    ) {}

    async create(
        user: User,
        conversationId: string,
        createInvitationDtos: CreateInvitationDto,
    ) {
        try {
            const { userReceiverIds } = createInvitationDtos;

            const conversation =
                await this.conversationService.findOne(conversationId);

            if (
                conversation.usersSenders.findIndex((u) => u.id === user.id) ===
                -1
            ) {
                throw new BadRequestException(
                    'You are not a sender of this conversation',
                );
            }

            if (!conversation.name) {
                throw new BadRequestException(
                    'The conversation is not a group',
                );
            }

            if (
                conversation.usersSenders.findIndex((u) =>
                    userReceiverIds.includes(u.id),
                ) >= 0
            ) {
                throw new BadRequestException(
                    'Invited user already in conversation',
                );
            }

            const contacts = await this.contactsService.findByUsers(
                user,
                userReceiverIds,
            );

            if (contacts.length !== userReceiverIds.length) {
                throw new NotFoundException('User not found in contacts');
            }

            const repeatedInvitations = await this.invitationRepository.find({
                where: {
                    conversation: { id: conversationId },
                    userReceiver: { id: In(userReceiverIds) },
                    state: In([
                        InvitationState.PENDING,
                        InvitationState.ACCEPTED,
                    ]),
                },
            });

            if (repeatedInvitations.length > 0) {
                throw new BadRequestException('Invitation already sent');
            }

            const invitations = userReceiverIds.map((id) => {
                return this.invitationRepository.create({
                    userSender: user,
                    userReceiver: { id },
                    conversation: { id: conversationId },
                });
            });

            await this.invitationRepository.save(invitations);

            return true;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findByUserAndByState(
        user: User,
        state: InvitationState,
        exclude: boolean,
    ) {
        try {
            const invitations = await this.invitationRepository.find({
                where: {
                    userReceiver: { id: user.id },
                    state: exclude ? Not(state) : state,
                },
                relations: [
                    'conversation',
                    'conversation.usersReceivers',
                    'userSender',
                    'userReceiver',
                ],
                order: { createdAt: 'DESC' },
            });

            const contactsIds = invitations.map((i) => i.userSender.id);

            const contacts = await this.contactsService.findByUsers(
                user,
                contactsIds,
            );

            return invitationsMapper(invitations, contacts);
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findPendingByConversation(user: User, conversationId: string) {
        try {
            const conversation =
                await this.conversationService.findOne(conversationId);

            if (
                conversation.usersSenders.findIndex(
                    (sender) => sender.id === user.id,
                ) === -1
            ) {
                throw new BadRequestException(
                    'You are not a sender of this conversation',
                );
            }

            const invitations = await this.invitationRepository.find({
                where: {
                    conversation: { id: conversationId },
                    state: InvitationState.PENDING,
                },
                relations: [
                    'conversation',
                    'conversation.usersReceivers',
                    'userSender',
                    'userReceiver',
                ],
                order: { createdAt: 'DESC' },
            });

            const contactsIds = invitations.map((i) => i.userSender.id);

            const contacts = await this.contactsService.findByUsers(
                user,
                contactsIds,
            );

            return invitationsMapper(invitations, contacts);
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    private async findOneByIdAndUserReceiver(user: User, id: string) {
        const invitation = await this.invitationRepository.findOne({
            where: {
                id,
                userReceiver: { id: user.id },
            },
            relations: ['conversation', 'userSender', 'userReceiver'],
        });

        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        return invitation;
    }

    private async findOneByIdAndUserSender(user: User, id: string) {
        const invitation = await this.invitationRepository.findOne({
            where: {
                id,
                userSender: { id: user.id },
            },
            relations: ['conversation', 'userSender', 'userReceiver'],
        });

        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        return invitation;
    }

    async answer(
        user: User,
        id: string,
        updateInvitationDto: UpdateInvitationDto,
    ) {
        try {
            const { state } = updateInvitationDto;

            if (state === 'pending') {
                throw new BadRequestException('Invalid state');
            }

            const invitation = await this.findOneByIdAndUserReceiver(user, id);

            if (invitation.state !== 'pending') {
                throw new BadRequestException('Invitation already answered');
            }

            const result = await this.invitationRepository.update(id, {
                state: updateInvitationDto.state,
                solvedAt: new Date(),
            });

            if (result.affected === 1 && state === 'accepted') {
                await this.conversationService.addInvitedUser(
                    invitation.conversation.id,
                    invitation.userReceiver,
                );

                return true;
            }

            return false;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async remove(user: User, id: string) {
        try {
            const invitation = await this.findOneByIdAndUserSender(user, id);

            if (invitation.state !== InvitationState.PENDING) {
                throw new BadRequestException('Invitation already answered');
            }

            const res = await this.invitationRepository.delete(id);

            return res.affected === 1;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    countPending(user: User) {
        return this.invitationRepository.count({
            where: {
                userReceiver: { id: user.id },
                state: InvitationState.PENDING,
            },
        });
    }
}
