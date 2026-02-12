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
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
    ChangePasswordDto,
    CreateUserDto,
    LoggedUserResponse,
    LoginUserDto,
    ResetPasswordDto,
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
            const { password, ...userData } = createUserDto;
            const normalizedPhone = normalizePhone(
                userData.phone,
                userData.countryCode,
            );

            const user = this.userRepository.create({
                ...userData,
                ...normalizedPhone,
                password: bcrypt.hashSync(password, 10),
            });

            await this.userRepository.save(user);

            const loggedUserResponse: LoggedUserResponse = {
                id: user.id,
                token: this.createJwt({ id: user.id }),
                fullName: user.fullName,
                phone: user.phone_e164,
                country: user.country_iso,
                expires: this.getExpires(),
            };

            return {
                ...loggedUserResponse,
            };
        } catch (error) {
            this.handleErrors(error);
        }
    }

    async login(loginUserDto: LoginUserDto) {
        const { phone, countryCode, password } = loginUserDto;

        const { phone_e164 } = normalizePhone(phone, countryCode);

        const user = await this.userRepository.findOne({
            where: { phone_e164 },
            select: {
                phone_e164: true,
                country_iso: true,
                password: true,
                id: true,
                fullName: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException(`Invalid Credentials (phone)`);
        }

        if (!bcrypt.compareSync(password, user.password)) {
            throw new UnauthorizedException(`Invalid Credentials (password)`);
        }

        const loggedUserResponse: LoggedUserResponse = {
            id: user.id,
            token: this.createJwt({ id: user.id }),
            fullName: user.fullName,
            phone: user.phone_e164,
            country: user.country_iso,
            expires: this.getExpires(),
        };

        return loggedUserResponse;
    }

    async checkAuthStatus(user: User) {
        return {
            ...user,
            token: this.createJwt({ id: user.id }),
            expires: this.getExpires(),
        };
    }

    async changePassword(changePasswordDto: ChangePasswordDto, user: User) {
        const { oldPassword, newPassword } = changePasswordDto;

        const userDb = await this.userRepository.findOne({
            where: { phone_e164: user.phone_e164 },
            select: {
                password: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException(`Invalid Credentials (email)`);
        }

        if (!bcrypt.compareSync(oldPassword, userDb!.password)) {
            throw new UnauthorizedException(`Invalid Credentials`);
        }

        try {
            const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
            const updatedUser = { ...user, password: hashedNewPassword };

            await this.userRepository.save({ ...updatedUser });

            return;
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException();
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

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { phone, countryCode, password, code, hashedCode } =
            resetPasswordDto;

        const { phone_e164 } = normalizePhone(phone, countryCode);

        const user = await this.userRepository.findOne({
            where: { phone_e164 },
            select: {
                id: true,
            },
        });

        if (!user) {
            throw new BadRequestException(`User not found`);
        }

        if (!bcrypt.compareSync(code.toString(), hashedCode)) {
            throw new BadRequestException(`Invalid verification code`);
        }

        try {
            const hashedPassword = bcrypt.hashSync(password, 10);
            await this.userRepository.update(user.id, {
                password: hashedPassword,
            });

            return;
        } catch (error) {
            this.handleErrors(error);
        }
    }

    private createJwt(payload: JwtPayload) {
        return this.jwtService.sign(payload);
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
