import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SKIP_TRANSFORM_KEY } from "../decorators/skip-transform.decorator";
import { ApiSuccessResponse } from "../interfaces/api-response.interface";

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const body: ApiSuccessResponse = {
          success: true,
          statusCode: response.statusCode,
          message: "OK",
          data: data ?? null,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
        return body;
      }),
    );
  }
}
