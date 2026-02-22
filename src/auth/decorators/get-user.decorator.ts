import {
    createParamDecorator,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';

import { User } from '../entities/user.entity';

export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user.user as User;

        if (req.user.type !== 'access') {
            throw new UnauthorizedException('Invalid token type');
        }

        delete user.refreshToken;

        return !data ? user : user[data];
    },
);
