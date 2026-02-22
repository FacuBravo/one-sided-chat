import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
    BasicPhoneDto,
    CreateUserDto,
    LoggedUserResponse,
    UpdateUserDataDto,
    VerifyIdTokenDto,
} from './dto';
import { normalizePhone } from 'src/utils/functions';
import { TwilioService } from 'src/utils/sms/twilio.service';
import { auth } from 'src/utils/firebase/config';

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
            this.handleErrors(error);
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
            this.handleErrors(error);
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
            this.handleErrors(error);
        }
    }

    async closeSession(user: User) {
        try {
            await this.userRepository.update(user.id, { refreshToken: null });
        } catch (error) {
            this.handleErrors(error);
        }
    }

    async updateUser(updateUserDataDto: UpdateUserDataDto, user: User) {
        if (!updateUserDataDto) {
            return {};
        }

        try {
            await this.userRepository.update(user.id, updateUserDataDto);

            return {
                ...updateUserDataDto,
            };
        } catch (error) {
            this.handleErrors(error);
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
            this.handleErrors(error);
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

            return this.renewTokens(user);
        } catch (error) {
            this.handleErrors(error);
        }
    }

    private createJwt(payload: JwtPayload) {
        return this.jwtService.sign(payload);
    }

    private createRefreshToken(payload: JwtPayload) {
        return this.jwtService.sign(payload, { expiresIn: '30d' });
    }

    private handleErrors(error: any): never {
        this.logger.error(error);

        if (error.code == 23505) {
            throw new BadRequestException(error.detail);
        } else if (error.code == 401) {
            throw new UnauthorizedException('Invalid token');
        } else if (error.response.statusCode == 400) {
            throw new BadRequestException(error.response.message);
        }

        throw new InternalServerErrorException(error.detail);
    }

    private getExpires(): Date {
        return new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
    }
}
