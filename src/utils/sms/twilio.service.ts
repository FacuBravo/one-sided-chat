import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    SendVerificationCodeResponse,
    VerifyCodeResponse,
} from './interfaces/twilio.responses';

@Injectable()
export class TwilioService {
    private client: any;
    private verifySid: string;

    constructor(private config: ConfigService) {
        this.client = require('twilio')(
            this.config.get<string>('TWILIO_ACCOUNT_SID'),
            this.config.get<string>('TWILIO_AUTH_TOKEN'),
        );

        this.verifySid = this.config.get<string>('TWILIO_VERIFY_SID') || '';
    }

    async sendVerificationSMS(
        to: string,
    ): Promise<SendVerificationCodeResponse> {
        return await this.client.verify.v2
            .services(this.verifySid)
            .verifications.create({ to, channel: 'sms' });
    }

    async verifySMSCode(
        phone: string,
        code: string,
    ): Promise<VerifyCodeResponse> {
        return await this.client.verify.v2
            .services(this.verifySid)
            .verificationChecks.create({
                to: phone,
                code,
            });
    }
}
