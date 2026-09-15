import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";
import { SkipTransform } from "@app/core";
import { Public } from "../auth";
import { HealthService } from "./health.service";

@Public()
@SkipTransform()
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Liveness — process đang chạy (K8s liveness, load balancer) */
  @Get()
  liveness() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness — Postgres và dependencies (worker monitor gọi endpoint này) */
  @Get("ready")
  async readiness() {
    const checks = await this.healthService.getReadinessChecks();
    const allUp = Object.values(checks).every((c) => c.status === "up");

    if (!allUp) {
      throw new ServiceUnavailableException({
        status: "error",
        checks,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: "ok",
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
