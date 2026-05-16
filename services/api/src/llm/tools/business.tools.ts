import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const WORKSPACE_ROOT = resolve(process.cwd(), "workspace");

function safePath(inputPath: string): string {
  const absolute = resolve(WORKSPACE_ROOT, inputPath);
  const rel = relative(WORKSPACE_ROOT, absolute);

  if (rel.startsWith("..") || rel.startsWith("/") || rel === "") {
    throw new Error(`Path traversal blocked: ${inputPath}`);
  }

  return absolute;
}

export const queryOrderTool = tool(
  async ({ orderId }: { orderId: string }) => {
    const path = safePath(`orders/${orderId}.json`);

    if (!existsSync(path)) {
      return { orderId, found: false, data: null };
    }

    const content = readFileSync(path, "utf-8");
    return { orderId, found: true, data: JSON.parse(content) };
  },
  {
    name: "query_order",
    description: "根据订单号查询订单详情，读取 workspace/orders/{orderId}.json",
    schema: z.object({
      orderId: z.string().describe("订单号，例如 EC20240315001"),
    }),
  },
);

export const queryProductTool = tool(
  async ({ productId }: { productId: string }) => {
    const path = safePath(`products/${productId}.json`);

    if (!existsSync(path)) {
      return { productId, found: false, data: null };
    }

    const content = readFileSync(path, "utf-8");
    return { productId, found: true, data: JSON.parse(content) };
  },
  {
    name: "query_product",
    description: "根据商品 ID 查询商品详情，读取 workspace/products/{productId}.json",
    schema: z.object({
      productId: z.string().describe("商品 ID"),
    }),
  },
);

export const readFileTool = tool(
  async ({ path: relativePath }: { path: string }) => {
    const path = safePath(relativePath);

    if (!existsSync(path)) {
      return { path: relativePath, found: false, content: null };
    }

    const content = readFileSync(path, "utf-8");
    return { path: relativePath, found: true, content };
  },
  {
    name: "read_file",
    description: "读取 workspace/ 下指定路径的文件内容，可用于查看政策、FAQ 等",
    schema: z.object({
      path: z.string().describe("相对于 workspace/ 的文件路径，例如 policies/return-policy.md"),
    }),
  },
);

export const writeFileTool = tool(
  async ({ path: relativePath, content }: { path: string; content: string }) => {
    const path = safePath(relativePath);
    writeFileSync(path, content, "utf-8");
    return { path: relativePath, written: true, bytes: Buffer.byteLength(content, "utf-8") };
  },
  {
    name: "write_file",
    description: "将内容写入 workspace/ 下指定路径，可用于生成工单、报告等",
    schema: z.object({
      path: z
        .string()
        .describe("相对于 workspace/ 的文件路径，例如 tickets/EC20240315001-analysis.md"),
      content: z.string().describe("要写入的文件内容"),
    }),
  },
);
