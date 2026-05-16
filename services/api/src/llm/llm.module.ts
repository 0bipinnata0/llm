import { Module } from "@nestjs/common";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";
import { RequirementService } from "./requirement.service";

@Module({
  providers: [LlmService, RequirementService],
  controllers: [LlmController],
  exports: [LlmService, RequirementService],
})
export class LlmModule {}
