import { Module } from "@nestjs/common";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";
import { MemoryController } from "./memory/memory.controller";
import { RunnableMemoryService } from "./memory/runnable-memory.service";
import { RequirementService } from "./requirement.service";
import { FilesystemController } from "./filesystem/filesystem.controller";
import { FilesystemService } from "./filesystem/filesystem.service";

@Module({
  providers: [LlmService, RequirementService, RunnableMemoryService, FilesystemService],
  controllers: [LlmController, MemoryController, FilesystemController],
  exports: [LlmService, RequirementService, RunnableMemoryService, FilesystemService],
})
export class LlmModule {}
