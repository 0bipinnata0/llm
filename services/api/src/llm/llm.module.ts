import { Module } from "@nestjs/common";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";
import { MemoryController } from "./memory/memory.controller";
import { RunnableMemoryService } from "./memory/runnable-memory.service";
import { RequirementService } from "./requirement.service";
import { FilesystemController } from "./filesystem/filesystem.controller";
import { FilesystemService } from "./filesystem/filesystem.service";
import { EmbeddingController } from "./embedding/embedding.controller";
import { EmbeddingService } from "./embedding/embedding.service";
import { VectorStoreService } from "./embedding/vector-store.service";
import { AgentsController } from "./agents/agents.controller";
import { OrchestratorService } from "./agents/orchestrator.service";

@Module({
  providers: [
    LlmService,
    RequirementService,
    RunnableMemoryService,
    FilesystemService,
    EmbeddingService,
    VectorStoreService,
    OrchestratorService,
  ],
  controllers: [
    LlmController,
    MemoryController,
    FilesystemController,
    EmbeddingController,
    AgentsController,
  ],
  exports: [
    LlmService,
    RequirementService,
    RunnableMemoryService,
    FilesystemService,
    EmbeddingService,
    VectorStoreService,
    OrchestratorService,
  ],
})
export class LlmModule {}
