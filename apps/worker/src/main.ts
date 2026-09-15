import * as dotenv from "dotenv";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";
import { HealthMonitorService } from "./health-monitor/health-monitor.service";

dotenv.config();

async function bootstrap() {
  const logger = new Logger("WorkerBootstrap");
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ["log", "warn", "error"],
  });

  const runOnStart = process.env.HEALTH_CHECK_ON_START !== "false";
  if (runOnStart) {
    const monitor = app.get(HealthMonitorService);
    logger.log("Running initial health check...");
    await monitor.checkHealth();
  }

  logger.log("Worker started — health monitor scheduled");
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
