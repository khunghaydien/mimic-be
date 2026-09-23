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

  async getReadinessChecks(): Promise<Record<string, HealthCheckResult>> {
    const startedAt = Date.now();
    try {
      await this.databaseService.dataSource.query("SELECT 1");
      return {
        database: { status: "up", latencyMs: Date.now() - startedAt },
      };
    } catch (error) {
      return {
        database: {
          status: "down",
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
