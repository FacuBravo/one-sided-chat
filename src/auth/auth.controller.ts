import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import {
    CreateUserDto,
    LoginUserDto,
    TokenDto,
    LoggedUserResponse,
    ChangePasswordDto,
    UpdateUserDataDto,
    ResetPasswordDto,
} from './dto';
import { GetUser, Auth } from './decorators';

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

    @Post('login')
    @ApiResponse({
        status: 201,
        description: 'Login a user',
        type: LoggedUserResponse,
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 403, description: 'Forbidden. Action not allowed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    loginUser(@Body() loginUserDto: LoginUserDto) {
        return this.authService.login(loginUserDto);
    }

    @Get('check-auth-status')
    @Auth()
    @ApiResponse({
        status: 200,
        description: 'Check authentication status',
        type: LoggedUserResponse,
    })
    @ApiResponse({ status: 403, description: 'Forbidden. Action not allowed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    checkAuthStatus(@GetUser() user: User) {
        return this.authService.checkAuthStatus(user);
    }

    @Post('google/login')
    @ApiResponse({
        status: 200,
        description: 'Login a user with Google',
        type: LoggedUserResponse,
    })
    @ApiResponse({ status: 403, description: 'Forbidden. Action not allowed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    loginGoogleUser(@Body() token: TokenDto) {
        return this.authService.loginGoogleUser(token.token);
    }

    @Patch('change-password')
    @Auth()
    @ApiResponse({
        status: 200,
        description: 'Change password',
    })
    @ApiResponse({ status: 403, description: 'Forbidden. Action not allowed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    changePassword(
        @Body() changePasswordDto: ChangePasswordDto,
        @GetUser() user: User,
    ) {
        return this.authService.changePassword(changePasswordDto, user);
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

    @Patch('forgot-password')
    @ApiResponse({
        status: 200,
        description: 'Reset password',
    })
    @ApiResponse({ status: 403, description: 'Forbidden. Action not allowed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
}
