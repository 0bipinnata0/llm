import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import { RunnableMemoryService } from "../src/llm/memory/runnable-memory.service";

function messageText(message: BaseMessage): string {
  return typeof message.content === "string"
    ? message.content
    : JSON.stringify(message.content);
}

class FakeRunnableMemoryService extends RunnableMemoryService {
  protected override createModel() {
    return RunnableLambda.from(async (input: unknown) => {
      const promptValue = input as { toChatMessages: () => BaseMessage[] };
      const humanMessages = promptValue
        .toChatMessages()
        .filter((message) => message._getType() === "human")
        .map(messageText);
      const orderId =
        humanMessages.find((content) => content.includes("EC20240315001")) ??
        "未提供订单号";

      return new AIMessage(
        `已结合${humanMessages.length}轮客服上下文；订单信息：${orderId}；本轮问题：${humanMessages.at(-1)}`,
      );
    });
  }
}

describe("RunnableMemoryService", () => {
  it("keeps multi-turn ecommerce customer-service context by sessionId", async () => {
    const service = new FakeRunnableMemoryService();

    await service.chat("s1", "我买的蓝牙耳机降噪效果不好，想退货");
    await service.chat("s1", "订单号是 EC20240315001");
    const result = await service.chat("s1", "帮我判断一下这个订单能不能退");

    expect(result).toContain("已结合3轮客服上下文");
    expect(result).toContain("EC20240315001");

    const history = await service.getHistory("s1");
    expect(history.map((message) => message.type)).toEqual([
      "human",
      "ai",
      "human",
      "ai",
      "human",
      "ai",
    ]);
    expect(history[0].content).toBe("我买的蓝牙耳机降噪效果不好，想退货");
    expect(history[2].content).toBe("订单号是 EC20240315001");
  });

  it("isolates histories across sessions", async () => {
    const service = new FakeRunnableMemoryService();

    await service.chat("s1", "订单号是 EC20240315001");
    const result = await service.chat("s2", "帮我判断一下这个订单能不能退");

    expect(result).toContain("已结合1轮客服上下文");
    expect(result).toContain("未提供订单号");
    expect(await service.getHistory("s1")).toHaveLength(2);
    expect(await service.getHistory("s2")).toHaveLength(2);
  });

  it("supports manual append and clearing one session", async () => {
    const service = new FakeRunnableMemoryService();

    await service.appendMessage("s1", "人工追加问题", "人工追加回复");
    await service.appendMessage("s2", "另一个会话", "另一个回复");

    expect(await service.getHistory("s1")).toEqual([
      { type: "human", content: "人工追加问题" },
      { type: "ai", content: "人工追加回复" },
    ]);

    await service.clearSession("s1");

    expect(await service.getHistory("s1")).toEqual([]);
    expect(await service.getHistory("s2")).toHaveLength(2);
  });
});
