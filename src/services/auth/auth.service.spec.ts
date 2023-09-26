import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { ACCESS_PASSWORD_ENV } from '../../configuration/readFile';


describe('Auth service test', () => {
    const jwtService = new JwtService();
    const authService = new AuthService(jwtService);

    it('No password set and no password given', async () => {
        const token = 'toto';
        process.env[ACCESS_PASSWORD_ENV] = '';
        jest.spyOn(jwtService, 'signAsync').mockImplementation(async () => token);

        const result = await authService.signIn('');
        expect(result.access_token).toEqual('toto');
    });

    it('No password set and one password given', async () => {
        const token = 'toto';
        process.env[ACCESS_PASSWORD_ENV] = '';
        jest.spyOn(jwtService, 'signAsync').mockImplementation(async () => token);

        // Generate random pass
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let pass = '';
        let counter = 0;
        while (counter < 15) {
            pass += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }

        // Test
        const result = await authService.signIn(pass);
        expect(result.access_token).toEqual('toto');
    });

    it('Password set and wrong password given', async () => {
        const token = 'toto';
        process.env[ACCESS_PASSWORD_ENV] = 'password';
        jest.spyOn(jwtService, 'signAsync').mockImplementation(async () => token);

        await expect(authService.signIn('password'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('Password set and good password given', async () => {
        const token = 'toto';
        const password = 'password';
        process.env[ACCESS_PASSWORD_ENV] = createHash('sha256').update(password).digest('hex');
        jest.spyOn(jwtService, 'signAsync').mockImplementation(async () => token);

        const result = await authService.signIn(password);
        expect(result.access_token).toEqual('toto');
    });

});