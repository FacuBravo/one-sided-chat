import { BadRequestException } from '@nestjs/common';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(input: string, country: string) {
    const phone = parsePhoneNumberFromString(input, country as CountryCode);

    if (!phone || !phone.isValid()) {
        throw new BadRequestException('Invalid phone number');
    }

    return {
        country_code: `+${phone.countryCallingCode}`,
        country_iso: phone.country,
        phone_number: phone.nationalNumber,
        phone_e164: phone.number,
    };
}
