import { BadRequestException, Body, Controller, Delete, Get, Post, Query } from "@nestjs/common";
import { RunnableMemoryService } from "./runnable-memory.service";

type SessionRequest = {
  sessionId?: string;
};

type ChatRequest = SessionRequest & {
  input?: string;
};

@Controller("api/memory")
export class MemoryController {
  constructor(private readonly memoryService: RunnableMemoryService) {}

  @Post("chat")
  async chat(@Body() body: ChatRequest) {
    const sessionId = this.requireNonEmpty(body?.sessionId, "sessionId");
    const input = this.requireNonEmpty(body?.input, "input");
    const result = await this.memoryService.chat(sessionId, input);

    return { result };
  }

  @Get("history")
  async history(@Query() query: SessionRequest, @Body() body?: SessionRequest) {
    const sessionId = this.resolveSessionId(query, body);
    const history = await this.memoryService.getHistory(sessionId);

    return { sessionId, history };
  }

  @Delete("clear")
  async clear(@Query() query: SessionRequest, @Body() body?: SessionRequest) {
    const sessionId = this.resolveSessionId(query, body);

    await this.memoryService.clearSession(sessionId);

    return { sessionId, cleared: true };
  }

  private resolveSessionId(query?: SessionRequest, body?: SessionRequest): string {
    return this.requireNonEmpty(query?.sessionId ?? body?.sessionId, "sessionId");
  }

  private requireNonEmpty(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException(`${field} is required`);
    }

    return value.trim();
  }
}
