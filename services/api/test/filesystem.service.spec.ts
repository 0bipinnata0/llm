import { FilesystemService } from "../src/llm/filesystem/filesystem.service";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

describe("FilesystemService", () => {
  const service = new FilesystemService();

  afterEach(() => {
    const ticketPath = resolve(process.cwd(), "workspace/tickets/EC20240315001-analysis.md");
    if (existsSync(ticketPath)) {
      unlinkSync(ticketPath);
    }
  });

  it("查询订单 EC20240315001 的详情", async () => {
    const result = await service.fileChat("查询订单 EC20240315001 的详情");

    expect(result.result).toContain("EC20240315001");
    expect(result.result).toContain("主动降噪蓝牙耳机 Pro");
  });

  it("读取 policies/return-policy.md 的退货政策", async () => {
    const result = await service.fileChat("读取 policies/return-policy.md 的退货政策");

    expect(result.result).toContain("7天无理由退货");
  });

  it("把退货判断结论写入 tickets/EC20240315001-analysis.md", async () => {
    const result = await service.fileChat(
      "订单 EC20240315001 的蓝牙耳机降噪效果不好，请查询退货政策，然后把退货判断结论写入 tickets/EC20240315001-analysis.md",
    );

    const ticketPath = resolve(process.cwd(), "workspace/tickets/EC20240315001-analysis.md");

    expect(existsSync(ticketPath)).toBe(true);

    const content = readFileSync(ticketPath, "utf-8");
    expect(content.length).toBeGreaterThan(0);
    expect(result.result).toContain("写入");
  });
});
