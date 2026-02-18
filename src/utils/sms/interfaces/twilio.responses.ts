export interface VerifyCodeResponse {
    sid: string;
    serviceSid: string;
    accountSid: string;
    to: string;
    channel: string;
    status: string;
    valid: boolean;
    amount: null;
    payee: null;
    dateCreated: Date;
    dateUpdated: Date;
}

export interface SendVerificationCodeResponse {
    sid: string;
    serviceSid: string;
    accountSid: string;
    to: string;
    channel: string;
    status: string;
    valid: boolean;
    lookup: Lookup;
    amount: null;
    payee: null;
    sendCodeAttempts: SendCodeAttempt[];
    dateCreated: Date;
    dateUpdated: Date;
    url: string;
}

export interface Lookup {
    carrier: null;
}

export interface SendCodeAttempt {
    attempt_sid: string;
    channel: string;
    time: Date;
}
