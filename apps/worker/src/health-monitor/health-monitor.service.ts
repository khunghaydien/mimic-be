import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AlertService } from "../alert/alert.service";

@Injectable()
export class HealthMonitorService {
  private readonly logger = new Logger(HealthMonitorService.name);
  private consecutiveFailures = 0;
  private lastAlertAt = 0;

  constructor(private readonly alertService: AlertService) {}

  @Cron(process.env.HEALTH_CHECK_CRON || CronExpression.EVERY_5_MINUTES)
  async runScheduledCheck(): Promise<void> {
    await this.checkHealth();
  }

  async checkHealth(): Promise<boolean> {
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";
    const healthUrl = `${apiBaseUrl.replace(/\/$/, "")}/health/ready`;
    const timeoutMs = Number(process.env.HEALTH_CHECK_TIMEOUT_MS ?? 10_000);

    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body = await response.text();

      if (!response.ok) {
        await this.onFailure(
          healthUrl,
          `HTTP ${response.status} — ${body.slice(0, 500)}`,
        );
        return false;
      }

      this.onSuccess(healthUrl);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      await this.onFailure(healthUrl, message);
      return false;
    }
  }

  private onSuccess(healthUrl: string): void {
    if (this.consecutiveFailures > 0) {
      this.logger.warn(
        `Health recovered after ${this.consecutiveFailures} failure(s): ${healthUrl}`,
      );
    }
    this.consecutiveFailures = 0;
    this.logger.log(`Health check OK: ${healthUrl}`);
  }

  private async onFailure(healthUrl: string, reason: string): Promise<void> {
    this.consecutiveFailures += 1;
    this.logger.error(
      `Health check FAILED (${this.consecutiveFailures}x): ${healthUrl} — ${reason}`,
    );

    const cooldownMs = Number(process.env.ALERT_COOLDOWN_MS ?? 300_000);
    const now = Date.now();
    if (now - this.lastAlertAt < cooldownMs) {
      this.logger.warn("Skipping alert (cooldown)");
      return;
    }

    const hasSlack = Boolean(process.env.SLACK_WEBHOOK_URL);
    const hasEmail =
      Boolean(process.env.ALERT_EMAIL_TO) && Boolean(process.env.SMTP_HOST);

    if (!hasSlack && !hasEmail) {
      this.logger.warn(
        "No SLACK_WEBHOOK_URL or SMTP configured — alert logged only",
      );
      return;
    }

    try {
      await this.alertService.sendHealthAlert({
        title: "API health check failed",
        message: reason,
        apiUrl: healthUrl,
        consecutiveFailures: this.consecutiveFailures,
      });
      this.lastAlertAt = now;
    } catch (error) {
      this.logger.error(
        `Failed to send alert: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
