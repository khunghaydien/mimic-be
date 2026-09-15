import * as dotenv from "dotenv";
import * as Sentry from "@sentry/nestjs";

/** Gọi trước NestFactory.create trong main.ts */
export function initSentry(): void {
  dotenv.config();

  const dsn = process.env.SENTRY_DSN;
  if (!dsn || process.env.SENTRY_ENABLED === "false") {
    return;
  }

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
}

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN && process.env.SENTRY_ENABLED !== "false");
}
