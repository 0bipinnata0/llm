import { BadRequestException } from "@nestjs/common";
import { MemoryController } from "../src/llm/memory/memory.controller";
import { RunnableMemoryService } from "../src/llm/memory/runnable-memory.service";

describe("MemoryController", () => {
  const service = {
    chat: async (sessionId: string, input: string) => `${sessionId}:${input}:result`,
    getHistory: async (sessionId: string) => [
      { type: "human", content: `${sessionId}:human` },
      { type: "ai", content: `${sessionId}:ai` },
    ],
    clearSession: async () => undefined,
  } as unknown as RunnableMemoryService;

  it("returns chat result for POST api/memory/chat", async () => {
    const controller = new MemoryController(service);

    await expect(
      controller.chat({
        sessionId: "s1",
        input: "我买的蓝牙耳机降噪效果不好，想退货",
      }),
    ).resolves.toEqual({
      result: "s1:我买的蓝牙耳机降噪效果不好，想退货:result",
    });
  });

  it("returns history for GET api/memory/history", async () => {
    const controller = new MemoryController(service);

    await expect(
      controller.history({ sessionId: "s1" }, undefined),
    ).resolves.toEqual({
      sessionId: "s1",
      history: [
        { type: "human", content: "s1:human" },
        { type: "ai", content: "s1:ai" },
      ],
    });
  });

  it("clears memory for DELETE api/memory/clear", async () => {
    const controller = new MemoryController(service);

    await expect(
      controller.clear({ sessionId: "s1" }, undefined),
    ).resolves.toEqual({
      sessionId: "s1",
      cleared: true,
    });
  });

  it("rejects requests without a sessionId", async () => {
    const controller = new MemoryController(service);

    await expect(controller.history({}, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
