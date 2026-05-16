import { type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Injectable } from "@nestjs/common";
import { createChatModel } from "./model.factory";

@Injectable()
export class LlmService {
  private model = createChatModel();
  async invokeDemo(input: string): Promise<string> {
    const systemMessage = new SystemMessage("你是一名需求结构化抽取助手");
    const humanMessage = new HumanMessage(
      `请从下面文本中抽取 action、constraints、entities：\n${input}`,
    );
    const messages: BaseMessage[] = [systemMessage, humanMessage];
    const response = await this.model.invoke(messages);
    return response.content.toString();
  }
}
