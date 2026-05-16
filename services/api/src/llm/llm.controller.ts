import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
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

  @Post("chain-invoke")
  async chainInvoke(@Body() body: { input: string }) {
    return this.llmService.chainInvoke(body.input);
  }

  @Post("chain-stream")
  async chainStream(@Body() body: { input: string }, @Res() res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await this.llmService.chainStream(body.input);

    for await (const chunk of stream) {
      res.write(chunk);
    }

    res.end();
  }

  @Post("chain-batch")
  async chainBatch(@Body() body: { inputs: string[] }) {
    return this.llmService.chainBatch(body.inputs);
  }
}
