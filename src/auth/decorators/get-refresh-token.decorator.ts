import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetRefreshToken = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        const authHeader = request.headers['authorization'];

        if (!authHeader) return null;

        const [type, token] = authHeader.split(' ');

        return type === 'Bearer' ? token : null;
    },
);
