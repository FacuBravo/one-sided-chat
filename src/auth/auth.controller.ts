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
import {
    BasicPhoneDto,
    CreateUserDto,
    LoggedUserResponse,
    UpdateUserDataDto,
    VerifyPhoneDto,
} from './dto';
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

    @Post('check-phone-availability')
    @ApiResponse({
        status: 200,
        description: 'Check phone number availability',
        type: LoggedUserResponse,
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    checkPhoneAvailability(@Body() checkPhoneDto: BasicPhoneDto) {
        return this.authService.checkPhoneAvailability(checkPhoneDto);
    }

    @Get('renew-tokens')
    @Auth()
    @ApiResponse({
        status: 200,
        description: 'Renew authentication tokens',
        type: LoggedUserResponse,
    })
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
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    closeSession(@GetUser() user: User) {
        return this.authService.closeSession(user);
    }

    @Post('send-verification-sms')
    @ApiResponse({
        status: 200,
        description: 'Send verification SMS',
        type: LoggedUserResponse,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    sendVerificationSMS(@Body() basicPhoneDto: BasicPhoneDto) {
        return this.authService.sendVerificationSMS(basicPhoneDto);
    }

    @Post('verify-sms-code')
    @ApiResponse({
        status: 200,
        description: 'Verify SMS code',
        type: LoggedUserResponse,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid token.' })
    verifySMSCode(@Body() verifyPhoneDto: VerifyPhoneDto) {
        return this.authService.verifySMSCode(verifyPhoneDto);
    }
}
