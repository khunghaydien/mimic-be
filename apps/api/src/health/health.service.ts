import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@app/database";

export type HealthCheckStatus = "up" | "down";

export interface HealthCheckResult {
  status: HealthCheckStatus;
  latencyMs?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async checkDatabase(): Promise<HealthCheckResult> {
    const startedAt = Date.now();
    try {
      await this.databaseService.dataSource.query("SELECT 1");
      return { status: "up", latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: "down",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getReadinessChecks(): Promise<Record<string, HealthCheckResult>> {
    return {
      database: await this.checkDatabase(),
    };
  }
}
