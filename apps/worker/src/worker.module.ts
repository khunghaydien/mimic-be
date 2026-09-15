import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AlertService } from "./alert/alert.service";
import { HealthMonitorService } from "./health-monitor/health-monitor.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [AlertService, HealthMonitorService],
})
export class WorkerModule {}
