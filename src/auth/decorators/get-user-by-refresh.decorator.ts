import {
    createParamDecorator,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';

import { User } from '../entities/user.entity';

export const GetUserByRefresh = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user.user as User;

        if (req.user.type !== 'refresh') {
            throw new UnauthorizedException('Invalid token type');
        }

        return !data ? user : user[data];
    },
);
