import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
  } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { NotFoundError } from '@prisma/client/runtime';
  
@Catch(NotFoundError)
export class NotFoundErrorFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: NotFoundError, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        const httpStatus = HttpStatus.NOT_FOUND;

        const responseBody = {
            statusCode: httpStatus,
            message: exception.message
        };

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}