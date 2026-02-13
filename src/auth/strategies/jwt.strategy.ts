import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        configService: ConfigService,
    ) {
        const jwtSecret = configService.get('JWT_SECRET_KEY');

        super({
            secretOrKey: jwtSecret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(
        payload: JwtPayload,
    ): Promise<{ user: User; type: 'access' | 'refresh' }> {
        const { id, type } = payload;
        const user = await this.userRepository.findOneBy({ id });

        if (!user || !type) {
            throw new UnauthorizedException('Token not valid');
        }

        return { user, type };
    }
}
