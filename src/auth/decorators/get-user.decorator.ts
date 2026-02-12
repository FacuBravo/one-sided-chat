import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '../entities/user.entity';

export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user as User;

        return !data ? user : user[data];
    },
);
