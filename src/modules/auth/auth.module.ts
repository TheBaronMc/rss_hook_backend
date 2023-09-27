import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from '../../services/auth/auth.service';
import { AuthController } from '../../controllers/auth/auth.controller';
import { getJwtConstants } from './constants';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: getJwtConstants().secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}