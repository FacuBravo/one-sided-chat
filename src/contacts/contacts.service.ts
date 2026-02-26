import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { handleErrors, normalizePhone } from 'src/utils/functions';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/user.entity';
import { usersMapper } from 'src/auth/mappers/user.mapper';
import { ContactResponseDto } from './dto/contact.response';

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

    findOne(id: string) {
        return `This action returns a #${id} contact`;
    }

    update(id: string, updateContactDto: UpdateContactDto) {
        return `This action updates a #${id} contact`;
    }

    remove(id: string) {
        return `This action removes a #${id} contact`;
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
}
