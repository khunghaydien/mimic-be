import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { ApiErrorResponse } from "../interfaces/api-response.interface";
import { reportExceptionToSentry } from "../sentry/report-exception";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let error = "Internal Server Error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message = responseObj.message || exception.message;
        error = responseObj.error || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(error && { error }),
    };

    const logMessage = Array.isArray(message) ? message.join(", ") : message;
    const logContext = {
      err: exception instanceof Error ? exception : undefined,
      req: { method: request.method, url: request.url },
      statusCode: status,
    };

    this.logger.error(
      logContext,
      `${request.method} ${request.url} - ${status} - ${logMessage}`,
    );

    reportExceptionToSentry(exception, request, status);

    response.status(status).json(errorResponse);
  }
}
