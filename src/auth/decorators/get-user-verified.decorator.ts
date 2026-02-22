import {
    createParamDecorator,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';

import { User } from '../entities/user.entity';

export const GetUserVerified = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user.user as User;

        if (req.user.type !== 'access') {
            throw new UnauthorizedException('Invalid token type');
        }

        if (!user.phoneVerified) {
            throw new ForbiddenException('Phone not verified');
        }

        return !data ? user : user[data];
    },
);
