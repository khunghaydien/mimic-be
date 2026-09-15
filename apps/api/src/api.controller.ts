import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth";

@Public()
@Controller()
export class ApiController {
  @Get()
  root() {
    return { name: "mimic-api", version: "0.0.1" };
  }
}
