import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryDeepPartialEntity, Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { handleErrors, normalizePhone } from 'src/utils/functions';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/user.entity';
import { usersMapper } from 'src/auth/mappers/user.mapper';
import { ContactResponseDto } from './dto/contact.response';
import { BasicPhoneDto, UserResponseDto } from 'src/auth/dto';

@Injectable()
export class ContactsService {
    private readonly logger = new Logger('ContactsService');

    constructor(
        @InjectRepository(Contact)
        private readonly contactRepository: Repository<Contact>,
        private readonly authService: AuthService,
    ) {}

    async create(user: User, createContactDto: CreateContactDto) {
        try {
            const { name, phone } = createContactDto;

            const referencedUser = await this.checkContactPhone(user, phone);

            const contact = this.contactRepository.create({
                name,
                user,
                referencedUser,
            });

            return await this.contactRepository.save(contact);
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findAll(user: User) {
        try {
            const contacts = await this.contactRepository.find({
                where: { user },
                relations: ['referencedUser'],
                order: { name: 'ASC', referencedUser: { fullName: 'ASC' } },
            });

            return contacts.map((contact) => ({
                ...contact,
                referencedUser: usersMapper([contact.referencedUser])[0],
            }));
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async update(user: User, id: string, updateContactDto: UpdateContactDto) {
        try {
            const contact = await this.findOneByUser(user, id);

            if (
                !updateContactDto ||
                Object.keys(updateContactDto).length === 0
            ) {
                throw new BadRequestException('No data provided for update');
            }

            const { name, phone } = updateContactDto;

            let referencedUser: UserResponseDto | null = null;

            if (phone) {
                referencedUser = await this.checkContactPhone(user, phone);
            }

            let updateContact: QueryDeepPartialEntity<Contact> = {
                name,
            };

            if (referencedUser) {
                updateContact = {
                    ...updateContact,
                    referencedUser: { id: referencedUser.id },
                };
            }

            const result = await this.contactRepository.update(
                contact.id,
                updateContact,
            );

            return result.affected ? result.affected > 0 : false;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async remove(user: User, id: string) {
        try {
            const contact = await this.findOneByUser(user, id);
            return await this.contactRepository.remove(contact);
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async findByUsers(
        referencedUsers: string[],
    ): Promise<ContactResponseDto[]> {
        const contacts = await this.contactRepository.find({
            where: { referencedUser: { id: In(referencedUsers) } },
            relations: ['referencedUser'],
        });

        return contacts.map((contact) => ({
            ...contact,
            referencedUser: usersMapper([contact.referencedUser])[0],
        }));
    }

    private getContactByUser(user: User, referencedUserId: string) {
        return this.contactRepository.findOne({
            where: { user, referencedUser: { id: referencedUserId } },
        });
    }

    private async findOneByUser(user: User, id: string) {
        const contact = await this.contactRepository.findOne({
            where: { id, user },
            relations: ['referencedUser'],
        });

        if (!contact) {
            throw new NotFoundException('Contact not found');
        }

        return contact;
    }

    private async checkContactPhone(user: User, phone: BasicPhoneDto) {
        if (phone.phone === user.phone_e164) {
            throw new BadRequestException(
                'You cannot create a contact with yourself',
            );
        }

        const phones_e164 = normalizePhone(
            phone.phone,
            phone.countryCode,
        ).phone_e164;

        const referencedUser =
            await this.authService.getUserByPhone(phones_e164);

        const existingContact = await this.getContactByUser(
            user,
            referencedUser.id,
        );

        if (existingContact) {
            throw new BadRequestException('Contact already exists');
        }

        return referencedUser;
    }
}
