import * as Sentry from "@sentry/nestjs";
import { Request } from "express";
import { isSentryEnabled } from "./init-sentry";

export function reportExceptionToSentry(
  exception: unknown,
  request: Request,
  statusCode: number,
): void {
  if (!isSentryEnabled() || statusCode < 500) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("method", request.method);
    scope.setTag("path", request.url);
    scope.setExtra("statusCode", statusCode);

    const user = (request as Request & { user?: { id?: string } }).user;
    if (user?.id) {
      scope.setUser({ id: String(user.id) });
    }

    if (exception instanceof Error) {
      Sentry.captureException(exception);
    } else {
      Sentry.captureMessage(String(exception), "error");
    }
  });
}
