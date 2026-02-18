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
    CheckPhoneDto,
    CreateUserDto,
    LoggedUserResponse,
    UpdateUserDataDto,
} from './dto';
import { normalizePhone } from 'src/utils/functions';

@Injectable()
export class AuthService {
    private readonly logger = new Logger('AuthService');

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
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

    async checkPhone(checkPhoneDto: CheckPhoneDto) {
        const normalizedPhone = normalizePhone(
            checkPhoneDto.phone,
            checkPhoneDto.countryCode,
        );

        try {
            const user = await this.userRepository.findOneBy({
                phone_e164: normalizedPhone.phone_e164,
            });

            if (user) {
                return true;
            } else {
                return false;
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
