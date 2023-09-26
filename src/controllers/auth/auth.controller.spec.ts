import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from '../../services/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_PASSWORD_ENV } from '../../configuration/readFile';
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';

describe('Article Controller', () => {
    let authController: AuthController;

    let authService: AuthService;
    let jwtService: JwtService;

    let app: TestingModule;
    
    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [AuthService, JwtService],
        }).compile();

        jwtService = app.get<JwtService>(JwtService);
        authService = app.get<AuthService>(AuthService);

        authController = app.get<AuthController>(AuthController);
    });

    describe('signIn', () => {

        it('No password set and no password given', async () => {
            const token = 'toto';
            process.env[ACCESS_PASSWORD_ENV] = '';
            jest.spyOn(jwtService, 'signAsync').mockImplementation(async () => token);
    
            const loginDto = {
                pass: ''
            };
            const result = await authController.signIn(loginDto);
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
            const loginDto = {
                pass
            };
            const result = await authController.signIn(loginDto);
            expect(result.access_token).toEqual('toto');
        });
    
        it('Password set and wrong password given', async () => {
            const token = 'toto';
            process.env[ACCESS_PASSWORD_ENV] = 'password';
            jest.spyOn(jwtService, 'signAsync').mockImplementation(async () => token);
    
            const loginDto = {
                pass: 'wrongpassword'
            };
            await expect(authController.signIn(loginDto))
            .rejects
            .toThrow(UnauthorizedException);
        });
    
        it('Password set and good password given', async () => {
            const token = 'toto';
            const password = 'password';
            process.env[ACCESS_PASSWORD_ENV] = createHash('sha256').update(password).digest('hex');
            jest.spyOn(jwtService, 'signAsync').mockImplementation(async () => token);
    
            const loginDto = {
                pass: password
            };
            const result = await authController.signIn(loginDto);
            expect(result.access_token).toEqual('toto');
        });
    });
});