import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    UnauthorizedException,
    Delete,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import { CreateUserDto, LoggedUserResponse, UpdateUserDataDto } from './dto';
import { GetUser, Auth, GetUserByRefresh, GetRefreshToken } from './decorators';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiResponse({
        status: 200,
        description: 'Register a new user',
        type: LoggedUserResponse,
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.authService.create(createUserDto);
    }

    @Get('renew-tokens')
    @Auth()
    @ApiResponse({
        status: 200,
        description: 'Renew authentication tokens',
        type: LoggedUserResponse,
    })
    @ApiResponse({ status: 403, description: 'Forbidden. Action not allowed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    checkAuthStatus(
        @GetUserByRefresh() user: User,
        @GetRefreshToken() refreshToken: string,
    ) {
        if (user.refreshToken !== refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        return this.authService.renewTokens(user);
    }

    @Patch()
    @Auth()
    @ApiResponse({
        status: 200,
        description: 'Update user',
        type: UpdateUserDataDto,
    })
    @ApiResponse({ status: 403, description: 'Forbidden. Action not allowed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    updateUser(
        @Body() updateUserDataDto: UpdateUserDataDto,
        @GetUser() user: User,
    ) {
        return this.authService.updateUser(updateUserDataDto, user);
    }

    @Delete('close-session')
    @Auth()
    @ApiResponse({
        status: 200,
        description: 'Close user session',
    })
    @ApiResponse({ status: 403, description: 'Forbidden. Action not allowed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    closeSession(@GetUser() user: User) {
        return this.authService.closeSession(user);
    }
}
