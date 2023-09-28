import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';

import { ACCESS_PASSWORD_ENV } from '../../configuration/readFile';


function hash(pass: string): string {
    return createHash('sha256').update(pass).digest('hex');
}

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService
    ) {}

    async signIn(pass: string): Promise<any> {

        if (process.env[ACCESS_PASSWORD_ENV].length > 0 
            && process.env[ACCESS_PASSWORD_ENV] != hash(pass) ) {
        throw new UnauthorizedException();
        }
        
        const payload = { sub: 'user' };
        return {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          access_token: await this.jwtService.signAsync(payload),
        };
    }
}