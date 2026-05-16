import { Controller, Post, Body } from "@nestjs/common";
import { OrchestratorService, type OrchestrateResult } from "./orchestrator.service";

interface OrchestrateBody {
  input: string;
}

@Controller("api/agents")
export class AgentsController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post("orchestrate")
  async orchestrate(@Body() body: OrchestrateBody): Promise<OrchestrateResult> {
    return this.orchestratorService.orchestrate(body.input);
  }
}
