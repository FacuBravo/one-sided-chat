import {
    BadRequestException,
    UnauthorizedException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';

export const handleErrors = (logger: Logger, error: any) => {
    logger.error(error);

    if (error.code == 23505) {
        throw new BadRequestException(error.detail);
    } else if (error.code == 401) {
        throw new UnauthorizedException('Invalid token');
    } else if (error.response.statusCode == 400) {
        throw new BadRequestException(error.response.message);
    }

    throw new InternalServerErrorException(error.detail);
};
