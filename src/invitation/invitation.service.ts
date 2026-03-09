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
import { Not, Repository } from 'typeorm';
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

            const contacts = await this.contactsService.findByUsers(
                user,
                userReceiverIds,
            );

            if (contacts.length !== userReceiverIds.length) {
                throw new NotFoundException('User not found in contacts');
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

    async findAllByState(user: User, state: InvitationState, exclude: boolean) {
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
            });

            return invitationsMapper(invitations);
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    findOne(id: number) {
        return `This action returns a #${id} invitation`;
    }

    update(id: number, updateInvitationDto: UpdateInvitationDto) {
        return `This action updates a #${id} invitation`;
    }

    remove(id: number) {
        return `This action removes a #${id} invitation`;
    }
}
