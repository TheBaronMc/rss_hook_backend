import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
  } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
  
@Catch(PrismaClientKnownRequestError)
export class PrismaClientKnownRequestErrorFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        const httpStatus = HttpStatus.BAD_REQUEST;

        const responseBody = {
            statusCode: httpStatus,
            message: exception.message
        };

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}