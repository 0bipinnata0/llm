import { Module } from "@nestjs/common";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";
import { MemoryController } from "./memory/memory.controller";
import { RunnableMemoryService } from "./memory/runnable-memory.service";
import { RequirementService } from "./requirement.service";

@Module({
  providers: [LlmService, RequirementService, RunnableMemoryService],
  controllers: [LlmController, MemoryController],
  exports: [LlmService, RequirementService, RunnableMemoryService],
})
export class LlmModule {}
