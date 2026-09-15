import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import { TransformResponseInterceptor } from "./interceptors/transform-response.interceptor";
import {
  serializeHttpRequest,
  serializeHttpResponse,
} from "./logger/http-serializers";

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level:
          process.env.LOG_LEVEL ??
          (process.env.NODE_ENV === "production" ? "info" : "debug"),
        transport:
          process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: { singleLine: true, colorize: true },
              }
            : undefined,
        autoLogging: true,
        serializers: {
          req: serializeHttpRequest,
          res: serializeHttpResponse,
        },
      },
    }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
  ],
  exports: [LoggerModule],
})
export class CoreModule {}
