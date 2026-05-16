import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createChatModel } from "../model.factory";

const model = createChatModel();
const parser = new StringOutputParser();

/* ───────── 1. 抽取 Agent ───────── */

const extractPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一名电商客服信息抽取助手。请从用户对话中抽取以下字段，输出严格 JSON（不要 markdown 代码块）：
{{
  "orderId": "string | null",
  "productId": "string | null",
  "requestType": "string | null",
  "receivedDate": "string | null",
  "isUnopened": "boolean | null"
}}
规则：
- 字段不存在或无法推断时填 null
- receivedDate 可以是相对时间（如"昨天"），尽量推断为具体日期
- isUnopened 为 true 当且仅当用户明确表示未拆封/未使用
- 不要编造信息，只抽取文本中明确或合理推断的内容`,
  ],
  ["human", "客服对话：\n{input}"],
]);

export const extractAgent = extractPrompt.pipe(model).pipe(parser);

/* ───────── 2. 政策校验 Agent ───────── */

const policyCheckPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一名电商售后政策审核专家。请根据以下退货政策和退款政策，判断用户的退货申请是否符合条件。

【退货政策要点】
1. 7天无理由退货：自签收之日起7天内，商品未使用、包装完好，可申请无理由退货。
2. 质量问题退货：商品存在功能性故障或与描述严重不符，可在30天内申请退货。
3. 特殊商品：定制类、生鲜类、虚拟商品不支持退货。
4. 退货商品需保持原包装、配件、发票齐全；人为损坏、进水、私自拆修的商品不予退货。

【退款政策要点】
1. 已签收订单需先按退货政策完成退货流程，仓库验收后3个工作日内退款。
2. 超过退款申请时效的订单不可退款。
3. 因用户个人原因导致商品损坏的订单不可退款。

请输出 JSON 格式（不要 markdown 代码块）：
{{
  "eligible": "boolean",
  "reason": "string",
  "policyRefs": ["string"]
}}`,
  ],
  [
    "human",
    `抽取信息：
{extractResult}

原始对话：
{input}`,
  ],
]);

export const policyCheckAgent = policyCheckPrompt.pipe(model).pipe(parser);

/* ───────── 3. 风控 Agent ───────── */

const riskReviewPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一名售后风控专家。请审查以下客服对话和抽取信息，识别以下类型的风险：
1. 信息歧义：同一信息存在多种理解方式
2. 信息冲突：不同信息之间存在矛盾
3. 关键信息缺失：影响决策的必要信息未提供
4. 异常行为：可能涉及欺诈或恶意退货的信号

请输出 JSON 数组格式（不要 markdown 代码块）：
[
  {{
    "type": "ambiguity | conflict | missing | anomaly",
    "field": "string | null",
    "description": "string",
    "severity": "low | medium | high"
  }}
]
如无风险，返回空数组 []`,
  ],
  [
    "human",
    `原始对话：
{input}

抽取信息：
{extractResult}`,
  ],
]);

export const riskReviewAgent = riskReviewPrompt.pipe(model).pipe(parser);

/* ───────── 4. QA Agent ───────── */

const qaPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一名测试验收专家。请根据以下抽取的退货申请信息，生成 Given-When-Then 格式的验收条件。

要求：
- 每个验收条件必须包含 Given（前置条件）、When（触发动作）、Then（预期结果）
- 覆盖正常流程和至少 1 个异常/边界场景
- 验收条件应可测试、可验证

请输出 JSON 格式（不要 markdown 代码块）：
{{
  "acceptanceCriteria": [
    {{
      "id": "string",
      "scenario": "string",
      "given": "string",
      "when": "string",
      "then": "string"
    }}
  ]
}}`,
  ],
  [
    "human",
    `抽取信息：
{extractResult}

原始对话：
{input}`,
  ],
]);

export const qaAgent = qaPrompt.pipe(model).pipe(parser);

/* ───────── 5. 汇总 Agent ───────── */

const summaryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一名售后主管。请汇总以下各 Agent 的分析结果，生成最终退货判断报告。

报告要求：
1. 给出明确的最终结论（批准 / 拒绝 / 转人工审核）
2. 说明结论依据
3. 列出所有识别的风险及建议处理方式
4. 如信息不足，明确列出需要补充的问题

请输出 JSON 格式（不要 markdown 代码块）：
{{
  "finalDecision": "approved | rejected | manual_review",
  "confidence": "high | medium | low",
  "summary": "string",
  "reasoning": "string",
  "risks": [
    {{
      "description": "string",
      "severity": "low | medium | high",
      "recommendation": "string"
    }}
  ],
  "nextSteps": ["string"]
}}`,
  ],
  [
    "human",
    `原始对话：
{input}

抽取结果：
{extractResult}

政策校验结果：
{policyCheckResult}

风险审查结果：
{riskReviewResult}

验收条件：
{qaResult}`,
  ],
]);

export const summaryAgent = summaryPrompt.pipe(model).pipe(parser);
