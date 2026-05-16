import { Injectable, Logger } from "@nestjs/common";
import {
  extractAgent,
  policyCheckAgent,
  riskReviewAgent,
  qaAgent,
  summaryAgent,
} from "./sub-agents";

export interface OrchestrateInput {
  input: string;
}

export interface OrchestrateResult {
  mode: "auto" | "clarification" | "fallback";
  clarificationQuestions: string[];
  usedAgents: string[];
  fallback: "manual_review" | null;
  steps: StepRecord[];
  report: Report | null;
}

export interface StepRecord {
  agent: string;
  status: "success" | "error" | "skipped";
  durationMs: number;
  output?: unknown;
  error?: string;
}

export interface Report {
  finalDecision: "approved" | "rejected" | "manual_review";
  confidence: "high" | "medium" | "low";
  summary: string;
  reasoning: string;
  risks: RiskItem[];
  nextSteps: string[];
}

export interface RiskItem {
  description: string;
  severity: "low" | "medium" | "high";
  recommendation: string;
}

interface ExtractResult {
  orderId?: string | null;
  productId?: string | null;
  requestType?: string | null;
  receivedDate?: string | null;
  isUnopened?: boolean | null;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  async orchestrate(input: string): Promise<OrchestrateResult> {
    const steps: StepRecord[] = [];
    const usedAgents: string[] = [];

    /* ── 步骤 1：抽取 ── */
    const extractStart = Date.now();
    let extractResult: ExtractResult;
    try {
      const raw = await extractAgent.invoke({ input });
      extractResult = this.safeJsonParse<ExtractResult>(raw, {});
      steps.push({
        agent: "extractAgent",
        status: "success",
        durationMs: Date.now() - extractStart,
        output: extractResult,
      });
      usedAgents.push("extractAgent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`extractAgent failed: ${msg}`);
      steps.push({
        agent: "extractAgent",
        status: "error",
        durationMs: Date.now() - extractStart,
        error: msg,
      });
      return this.buildFallback(steps, usedAgents);
    }

    /* ── 关键字段校验 ── */
    const missingFields = this.checkMissingFields(extractResult);
    if (missingFields.length > 0) {
      const clarificationQuestions = await this.generateClarificationQuestions(
        input,
        extractResult,
        missingFields,
      );
      steps.push({
        agent: "validation",
        status: "success",
        durationMs: 0,
        output: { missingFields },
      });
      return {
        mode: "clarification",
        clarificationQuestions,
        usedAgents: [...usedAgents, "validation"],
        fallback: null,
        steps,
        report: null,
      };
    }

    /* ── 步骤 2：并行（政策校验 + 风控）─ */
    const parallelStart = Date.now();
    let policyCheckResult: unknown;
    let riskReviewResult: unknown;

    try {
      const extractResultJson = JSON.stringify(extractResult);
      [policyCheckResult, riskReviewResult] = await Promise.all([
        policyCheckAgent
          .invoke({ input, extractResult: extractResultJson })
          .then((r) => this.safeJsonParse(r, {}))
          .catch((err) => {
            throw { agent: "policyCheckAgent", error: err };
          }),
        riskReviewAgent
          .invoke({ input, extractResult: extractResultJson })
          .then((r) => this.safeJsonParse(r, []))
          .catch((err) => {
            throw { agent: "riskReviewAgent", error: err };
          }),
      ]);

      steps.push({
        agent: "policyCheckAgent",
        status: "success",
        durationMs: Date.now() - parallelStart,
        output: policyCheckResult,
      });
      steps.push({
        agent: "riskReviewAgent",
        status: "success",
        durationMs: Date.now() - parallelStart,
        output: riskReviewResult,
      });
      usedAgents.push("policyCheckAgent", "riskReviewAgent");
    } catch (err: unknown) {
      const typed = err as { agent?: string; error?: unknown };
      const agentName = typed.agent ?? "parallel";
      const msg =
        typed.error instanceof Error
          ? typed.error.message
          : String(typed.error ?? err);
      this.logger.error(`${agentName} failed: ${msg}`);
      steps.push({
        agent: agentName,
        status: "error",
        durationMs: Date.now() - parallelStart,
        error: msg,
      });
      return this.buildFallback(steps, usedAgents);
    }

    /* ── 步骤 3：QA ── */
    const qaStart = Date.now();
    let qaResult: unknown;
    try {
      const raw = await qaAgent.invoke({
        input,
        extractResult: JSON.stringify(extractResult),
      });
      qaResult = this.safeJsonParse(raw, {});
      steps.push({
        agent: "qaAgent",
        status: "success",
        durationMs: Date.now() - qaStart,
        output: qaResult,
      });
      usedAgents.push("qaAgent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`qaAgent failed: ${msg}`);
      steps.push({
        agent: "qaAgent",
        status: "error",
        durationMs: Date.now() - qaStart,
        error: msg,
      });
      return this.buildFallback(steps, usedAgents);
    }

    /* ── 步骤 4：汇总 ── */
    const summaryStart = Date.now();
    let report: Report;
    try {
      const raw = await summaryAgent.invoke({
        input,
        extractResult: JSON.stringify(extractResult),
        policyCheckResult: JSON.stringify(policyCheckResult),
        riskReviewResult: JSON.stringify(riskReviewResult),
        qaResult: JSON.stringify(qaResult),
      });
      report = this.safeJsonParse<Report>(raw, {
        finalDecision: "manual_review",
        confidence: "low",
        summary: "汇总 Agent 解析失败，转人工审核",
        reasoning: "输出格式不符合预期",
        risks: [],
        nextSteps: ["转人工客服处理"],
      });
      steps.push({
        agent: "summaryAgent",
        status: "success",
        durationMs: Date.now() - summaryStart,
        output: report,
      });
      usedAgents.push("summaryAgent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`summaryAgent failed: ${msg}`);
      steps.push({
        agent: "summaryAgent",
        status: "error",
        durationMs: Date.now() - summaryStart,
        error: msg,
      });
      return this.buildFallback(steps, usedAgents);
    }

    return {
      mode: "auto",
      clarificationQuestions: [],
      usedAgents,
      fallback: null,
      steps,
      report,
    };
  }

  /* ── 工具方法 ── */

  private checkMissingFields(result: ExtractResult): string[] {
    const missing: string[] = [];
    if (!result.orderId) missing.push("orderId");
    if (!result.requestType) missing.push("requestType");
    return missing;
  }

  private async generateClarificationQuestions(
    input: string,
    extractResult: ExtractResult,
    missingFields: string[],
  ): Promise<string[]> {
    const questions: string[] = [];
    if (missingFields.includes("orderId")) {
      questions.push("请提供您的订单号，以便我们查询订单信息。");
    }
    if (missingFields.includes("requestType")) {
      questions.push("请问您需要办理退货、换货还是退款？");
    }
    if (!extractResult.productId) {
      questions.push("请提供商品名称或商品编号，以便确认商品信息。");
    }
    if (extractResult.isUnopened === null) {
      questions.push("请问商品是否已经拆封或使用？");
    }
    if (!extractResult.receivedDate) {
      questions.push("请问您是什么时候收到商品的？");
    }
    return questions;
  }

  private buildFallback(
    steps: StepRecord[],
    usedAgents: string[],
  ): OrchestrateResult {
    return {
      mode: "fallback",
      clarificationQuestions: [],
      usedAgents,
      fallback: "manual_review",
      steps,
      report: null,
    };
  }

  private safeJsonParse<T>(raw: string, fallback: T): T {
    try {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      return JSON.parse(cleaned) as T;
    } catch {
      return fallback;
    }
  }
}
