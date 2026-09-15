import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

export interface HealthAlertPayload {
  title: string;
  message: string;
  apiUrl: string;
  consecutiveFailures: number;
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  async sendHealthAlert(payload: HealthAlertPayload): Promise<void> {
    const text = [
      payload.title,
      "",
      payload.message,
      "",
      `URL: ${payload.apiUrl}`,
      `Consecutive failures: ${payload.consecutiveFailures}`,
      `Time: ${new Date().toISOString()}`,
    ].join("\n");

    await Promise.allSettled([
      this.sendSlack(text),
      this.sendEmail(payload.title, text),
    ]);
  }

  private async sendSlack(text: string): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Slack webhook failed: ${response.status} ${body}`);
    }

    this.logger.log("Slack alert sent");
  }

  private async sendEmail(subject: string, text: string): Promise<void> {
    const to = process.env.ALERT_EMAIL_TO;
    const host = process.env.SMTP_HOST;
    if (!to || !host) {
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: `[MIMIC] ${subject}`,
      text,
    });

    this.logger.log(`Email alert sent to ${to}`);
  }
}
