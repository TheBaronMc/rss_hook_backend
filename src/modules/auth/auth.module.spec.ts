import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { INestApplication } from '@nestjs/common';
import { ACCESS_PASSWORD_ENV, ENVIRONMENT_DEV_VALUE, ENVIRONMENT_ENV } from '../../configuration/readFile';
import { createHash } from 'crypto';

describe('Auth Module', () => {
    let app: INestApplication;

    beforeAll(async () => {
        process.env[ENVIRONMENT_ENV] = ENVIRONMENT_DEV_VALUE;

        const moduleRef = await Test.createTestingModule({
            imports: [AuthModule],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    describe('POST /auth/login', () => {
        it('Empty body', async () => {
            const response = await request(app.getHttpServer())
              .post('/auth/login')
              .send();

            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Missing `pass` in body', async () => {
            const response = await request(app.getHttpServer())
              .post('/auth/login')
              .send({});

            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Pass wrong type 1', async () => {
            const response = await request(app.getHttpServer())
              .post('/auth/login')
              .send({ pass: 1 });

            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Pass wrong type 1', async () => {
            const response = await request(app.getHttpServer())
              .post('/auth/login')
              .send({ pass: {} });

            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Pass wrong type 1', async () => {
            const response = await request(app.getHttpServer())
              .post('/auth/login')
              .send({ pass: [] });

            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('No pass set, empty pass send', async () => {
            process.env[ACCESS_PASSWORD_ENV] = '';

            const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ pass: '' });
              
            expect(response.statusCode >= 300).toBeFalsy();
            expect(response.body.access_token).toBeDefined();
            expect(typeof(response.body.access_token) == 'string').toBeTruthy();
        });

        it('No pass set, random pass send', async () => {
            process.env[ACCESS_PASSWORD_ENV] = '';
            // Generate random pass
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            let randomPass = '';
            let counter = 0;
            while (counter < 15) {
                randomPass += characters.charAt(Math.floor(Math.random() * charactersLength));
                counter += 1;
            }

            const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ pass: randomPass });
              
            expect(response.statusCode >= 300).toBeFalsy();
            expect(response.body.access_token).toBeDefined();
            expect(typeof(response.body.access_token) == 'string').toBeTruthy();
        });

        it('Password set, wrong password given', async () => {
            const password = 'password';
            const wrongPassword = 'wrongPassword';
            process.env[ACCESS_PASSWORD_ENV] = createHash('sha256').update(password).digest('hex');

            const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ pass: wrongPassword });
              
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Password set, good password given', async () => {
            const password = 'password';
            process.env[ACCESS_PASSWORD_ENV] = createHash('sha256').update(password).digest('hex');

            const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ pass: password });
              
            expect(response.statusCode >= 300).toBeFalsy();
            expect(response.body.access_token).toBeDefined();
            expect(typeof(response.body.access_token) == 'string').toBeTruthy();
        });
    });
});