import { BadRequestException } from '@nestjs/common';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(input: string, country: string) {
    if (country === 'AR') {
        if (input.startsWith('+54') && !input.startsWith('+549')) {
            const rest = input.slice(3);
            input = `+549${rest}`;
        }
    }

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
