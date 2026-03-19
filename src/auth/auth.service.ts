import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { In, QueryPartialEntity, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
    BasicPhoneDto,
    CreateUserDto,
    LoggedUserResponse,
    UpdatePushTokenDto,
    UpdateUserDataDto,
    VerifyIdTokenDto,
} from './dto';
import { handleErrors, normalizePhone } from 'src/utils/functions';
import { TwilioService } from 'src/utils/sms/twilio.service';
import { auth } from 'src/utils/firebase/config';
import { usersMapper } from './mappers/user.mapper';

@Injectable()
export class AuthService {
    private readonly logger = new Logger('AuthService');

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly twilioService: TwilioService,
    ) {}

    async create(createUserDto: CreateUserDto) {
        try {
            const normalizedPhone = normalizePhone(
                createUserDto.phone,
                createUserDto.countryCode,
            );

            const user = this.userRepository.create({
                ...createUserDto,
                ...normalizedPhone,
            });

            await this.userRepository.save(user);

            const loggedUserResponse: LoggedUserResponse = {
                id: user.id,
                token: this.createJwt({ id: user.id, type: 'access' }),
                fullName: user.fullName,
                phone: user.phone_e164,
                country: user.country_iso,
                expires: this.getExpires(),
                refreshToken: this.createRefreshToken({
                    id: user.id,
                    type: 'refresh',
                }),
                username: user.username,
                phoneVerified: false,
            };

            await this.userRepository.update(user.id, {
                refreshToken: loggedUserResponse.refreshToken,
            });

            return {
                ...loggedUserResponse,
            };
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async checkPhoneAvailability(checkPhoneDto: BasicPhoneDto) {
        const normalizedPhone = normalizePhone(
            checkPhoneDto.phone,
            checkPhoneDto.countryCode,
        );

        try {
            const user = await this.userRepository.findOneBy({
                phone_e164: normalizedPhone.phone_e164,
            });

            if (user) {
                return false;
            } else {
                return true;
            }
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async renewTokens(user: User) {
        const loggedUserResponse: LoggedUserResponse = {
            token: this.createJwt({ id: user.id, type: 'access' }),
            expires: this.getExpires(),
            refreshToken: this.createRefreshToken({
                id: user.id,
                type: 'refresh',
            }),
            phone: user.phone_e164,
            country: user.country_iso,
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            phoneVerified: user.phoneVerified,
        };

        try {
            await this.userRepository.update(user.id, {
                refreshToken: loggedUserResponse.refreshToken,
            });

            return loggedUserResponse;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async closeSession(user: User) {
        try {
            await this.userRepository.update(user.id, { refreshToken: null });
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async updateUser(updateUserDataDto: UpdateUserDataDto, user: User) {
        try {
            if (!updateUserDataDto) {
                throw new BadRequestException('Invalid data');
            }

            const { phone, countryCode, fullName } = updateUserDataDto;

            if ((phone && !countryCode) || (!phone && countryCode)) {
                throw new BadRequestException('Invalid data');
            }

            let updatePayload: QueryPartialEntity<User> = {
                fullName,
            };

            if (phone && countryCode) {
                const normalizedPhone = normalizePhone(phone, countryCode);

                updatePayload = {
                    ...updatePayload,
                    ...normalizedPhone,
                    phoneVerified: false,
                };
            }

            const result = await this.userRepository.update(
                user.id,
                updatePayload,
            );

            return result.affected ? result.affected > 0 : false;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async sendVerificationSMS(basicPhoneDto: BasicPhoneDto) {
        try {
            const { phone_e164 } = normalizePhone(
                basicPhoneDto.phone,
                basicPhoneDto.countryCode,
            );

            return await this.twilioService.sendVerificationSMS(phone_e164);
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async verifyIdToken(verifyIdTokenDto: VerifyIdTokenDto) {
        try {
            const { phone_e164 } = normalizePhone(
                verifyIdTokenDto.phone,
                verifyIdTokenDto.countryCode,
            );

            const decoded = await auth.verifyIdToken(verifyIdTokenDto.idToken);

            const phone = decoded.phone_number;

            if (phone_e164 !== phone) {
                throw new BadRequestException('Invalid phone number');
            }

            const user = await this.userRepository.findOneBy({
                phone_e164,
            });

            if (!user) {
                throw new BadRequestException('User not found');
            }

            await this.userRepository.update(user.id, { phoneVerified: true });

            return this.renewTokens({ ...user, phoneVerified: true });
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    getUsersByPhones(phones_e164: string[]) {
        try {
            return this.userRepository.findBy({
                phone_e164: In(phones_e164),
            });
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async getUserByPhone(phone_e164: string) {
        try {
            const user = await this.userRepository.findOneBy({
                phone_e164: phone_e164,
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            return usersMapper([user])[0];
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async registerPushToken(
        updatePushTokenDto: UpdatePushTokenDto,
        user: User,
    ) {
        try {
            const result = await this.userRepository.update(
                user.id,
                updatePushTokenDto,
            );
            return result.affected ? result.affected > 0 : false;
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    async getPushTokens(ids: string[]) {
        try {
            const result = await this.userRepository.find({
                where: {
                    id: In(ids),
                },
                select: ['id', 'pushToken'],
            });

            return result
                .map((user) => ({
                    id: user.id,
                    pushToken: user.pushToken as string,
                }))
                .filter(
                    (user) =>
                        user.pushToken !== null &&
                        user.pushToken !== undefined &&
                        user.pushToken !== '',
                );
        } catch (error) {
            return handleErrors(this.logger, error);
        }
    }

    private createJwt(payload: JwtPayload) {
        return this.jwtService.sign(payload);
    }

    private createRefreshToken(payload: JwtPayload) {
        return this.jwtService.sign(payload, { expiresIn: '30d' });
    }

    private getExpires(): Date {
        return new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
    }
}
