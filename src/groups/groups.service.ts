import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Invitation } from './entities/invitation.entity';
import { handleErrors, normalizePhone } from 'src/utils/functions';
import { AuthService } from 'src/auth/auth.service';
import { BasicPhoneDto } from 'src/auth/dto';

@Injectable()
export class GroupsService {
    private readonly logger = new Logger('GroupsService');

    constructor(
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(Invitation)
        private readonly invitationRepository: Repository<Invitation>,
        private readonly authService: AuthService,
    ) {}

    async create(user: User, createGroupDto: CreateGroupDto) {
        try {
            const { name, description, invitedPhones, phones } = createGroupDto;

            let invitedUsers: User[] = [];

            if (invitedPhones) {
                invitedUsers = await this.getUsersByPhones(invitedPhones, user);
            }

            const usersReceivers = await this.getUsersByPhones(phones, user);

            const group = this.groupRepository.create({
                name,
                description,
                usersSenders: [user],
                usersReceivers,
            });

            const savedGroup = await this.groupRepository.save(group);

            if (invitedUsers.length) {
                const invitations = invitedUsers.map((userReceiver) =>
                    this.invitationRepository.create({
                        group: savedGroup,
                        userSender: user,
                        userReceiver,
                    }),
                );

                await this.invitationRepository.save(invitations);
            }

            return {
                group: savedGroup,
            };
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    findAll() {
        return `This action returns all groups`;
    }

    async findOne(id: string) {
        const group = await this.groupRepository.find({
            where: { id },
            relations: ['usersSenders', 'usersReceivers'],
        });

        if (!group) {
            throw new BadRequestException('Group not found');
        }

        return group[0];
    }

    update(id: string, updateGroupDto: UpdateGroupDto) {
        return `This action updates a #${id} group`;
    }

    remove(id: string) {
        return `This action removes a #${id} group`;
    }

    private async getUsersByPhones(phones: BasicPhoneDto[], user: User) {
        if (phones.find((phone) => phone.phone === user.phone_e164)) {
            throw new BadRequestException(
                'You cannot invite yourself to a group',
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
