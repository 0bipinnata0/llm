import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { Injectable } from "@nestjs/common";
import { createChatModel } from "../model.factory";
import {
  queryOrderTool,
  queryProductTool,
  readFileTool,
  writeFileTool,
} from "../tools/business.tools";

@Injectable()
export class FilesystemService {
  private model = createChatModel();
  private tools = [queryOrderTool, queryProductTool, readFileTool, writeFileTool];
  private toolMap = Object.fromEntries(this.tools.map((t) => [t.name, t]));

  async fileChat(input: string) {
    const modelWithTools = this.model.bindTools(this.tools);

    const messages: BaseMessage[] = [
      new SystemMessage(
        "你是一名电商客服助手，拥有查询订单、商品、读取政策文件和写入工单的能力。" +
          "当用户的问题涉及订单、商品、政策或需要记录结论时，请调用相应工具获取信息或写入文件。" +
          "所有文件操作限制在 workspace/ 目录下。",
      ),
      new HumanMessage(input),
    ];

    const maxIterations = 5;

    for (let i = 0; i < maxIterations; i++) {
      const response = await modelWithTools.invoke(messages);
      messages.push(response);

      const toolCalls = response.tool_calls ?? [];
      if (toolCalls.length === 0) {
        return { result: response.content };
      }

      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const targetTool = this.toolMap[toolCall.name];
          if (!targetTool) {
            return new ToolMessage({
              tool_call_id: toolCall.id ?? "",
              content: JSON.stringify({ error: `Unknown tool: ${toolCall.name}` }),
            });
          }

          const result = await (targetTool.invoke as (input: unknown) => Promise<unknown>)(
            toolCall.args,
          );

          return new ToolMessage({
            tool_call_id: toolCall.id ?? "",
            content: JSON.stringify(result),
          });
        }),
      );

      messages.push(...toolResults);
    }

    const finalResponse = await modelWithTools.invoke(messages);
    return { result: finalResponse.content };
  }
}
