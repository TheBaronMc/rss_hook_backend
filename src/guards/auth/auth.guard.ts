import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtConstants } from '../../modules/auth/constants';
import { Request } from 'express';
import { ACCESS_PASSWORD_ENV } from '../../configuration/readFile';
  
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (process.env[ACCESS_PASSWORD_ENV] === '') {
            return true;
        }

        if (!token) {
            throw new UnauthorizedException();
        }
        try {
        const payload = await this.jwtService.verifyAsync(
            token,
            {
                secret: getJwtConstants().secret
            }
        );
        // 💡 We're assigning the payload to the request object here
        // so that we can access it in our route handlers
        request['user'] = payload;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}