import { Body, Controller, Post } from "@nestjs/common";
import { LlmService } from "./llm.service";

@Controller("api/langchain")
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post("invoke")
  async invoke(@Body() body: { input: string }) {
    const result = await this.llmService.invokeDemo(body.input);
    return { result };
  }

  @Post("prompt-preview")
  async promptPreview(@Body() body: { input: string }) {
    return this.llmService.promptPreview(body.input);
  }

  @Post("prompt-to-model")
  async promptToModel(@Body() body: { input: string }) {
    return this.llmService.promptToModel(body.input);
  }
}
