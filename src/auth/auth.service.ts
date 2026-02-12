import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
    ChangePasswordDto,
    CreateGoogleUserDto,
    CreateUserDto,
    LoggedUserResponse,
    LoginUserDto,
    ResetPasswordDto,
    UpdateUserDataDto,
} from './dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger('AuthService');
    private readonly client = new OAuth2Client();

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async create(createUserDto: CreateUserDto) {
        try {
            const { password, ...userData } = createUserDto;
            const user = this.userRepository.create({
                ...userData,
                password: bcrypt.hashSync(password, 10),
                loginType: 'regular',
            });

            await this.userRepository.save(user);

            const loggedUserResponse: LoggedUserResponse = {
                id: user.id,
                token: this.createJwt({ id: user.id }),
                email: user.email,
                expires: this.getExpires(),
                loggedWith: 'regular',
            };

            return {
                ...loggedUserResponse,
            };
        } catch (error) {
            this.handleErrors(error);
        }
    }

    async login(loginUserDto: LoginUserDto) {
        const { email, password } = loginUserDto;

        const user = await this.userRepository.findOne({
            where: { email },
            select: {
                email: true,
                password: true,
                id: true,
                loginType: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException(`Invalid Credentials (email)`);
        }

        if (user.loginType === 'google') {
            throw new BadRequestException(`User registered with Google`);
        }

        if (!bcrypt.compareSync(password, user.password)) {
            throw new UnauthorizedException(`Invalid Credentials (password)`);
        }

        const loggedUserResponse: LoggedUserResponse = {
            id: user.id,
            token: this.createJwt({ id: user.id }),
            email: user.email,
            expires: this.getExpires(),
            loggedWith: 'regular',
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

    async loginGoogleUser(token: string) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: this.configService.get('GOOGLE_CLIENT_ID'),
            });

            const payload = ticket.getPayload();

            if (!payload) {
                throw new Error();
            }

            return this.checkGoogleUser(payload);
        } catch (error) {
            const customError = {
                message: error,
                code: 401,
            };

            this.handleErrors(customError);
        }
    }

    async changePassword(changePasswordDto: ChangePasswordDto, user: User) {
        const { oldPassword, newPassword } = changePasswordDto;

        const userDb = await this.userRepository.findOne({
            where: { email: user.email },
            select: {
                password: true,
                loginType: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException(`Invalid Credentials (email)`);
        }

        if (user.loginType === 'google') {
            throw new BadRequestException(`User registered with Google`);
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
        const { email, password, code, hashedCode } = resetPasswordDto;

        const user = await this.userRepository.findOne({
            where: { email },
            select: {
                id: true,
                loginType: true,
            },
        });

        if (!user) {
            throw new BadRequestException(`User not found`);
        }

        if (user.loginType === 'google') {
            throw new BadRequestException(`User registered with Google`);
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

    private async checkGoogleUser(payload: TokenPayload) {
        const { email, name } = payload;

        if (!email) {
            throw new UnauthorizedException('Google token is invalid');
        }

        const user = await this.userRepository.findOne({
            where: { email },
            select: {
                email: true,
                id: true,
                loginType: true,
            },
        });

        if (!user) {
            return this.createGoogleUser({
                email,
            });
        }

        const loggedUserResponse: LoggedUserResponse = {
            token: this.createJwt({ id: user.id }),
            expires: this.getExpires(),
            id: user.id,
            email: user.email,
            loggedWith: user.loginType,
        };

        return loggedUserResponse;
    }

    private async createGoogleUser(createGoogleUserDto: CreateGoogleUserDto) {
        try {
            const user = this.userRepository.create({
                ...createGoogleUserDto,
                loginType: 'google',
            });

            await this.userRepository.save(user);

            const loggedUserResponse: LoggedUserResponse = {
                id: user.id,
                token: this.createJwt({ id: user.id }),
                email: user.email,
                expires: this.getExpires(),
                loggedWith: 'google',
            };

            return loggedUserResponse;
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
        }

        throw new InternalServerErrorException(error.detail);
    }

    private getExpires(): Date {
        return new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
    }
}
