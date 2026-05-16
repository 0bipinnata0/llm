import { z } from "zod";

const emptyStringAsUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const apiEnvSchema = z.object({
  OPENAI_API_KEY: z.preprocess(
    emptyStringAsUndefined,
    z
      .string({ required_error: "OPENAI_API_KEY is required" })
      .trim()
      .min(1, "OPENAI_API_KEY is required"),
  ),
  OPENAI_BASE_URL: z.preprocess(
    emptyStringAsUndefined,
    z
      .string()
      .trim()
      .url("OPENAI_BASE_URL must be a valid URL")
      .optional(),
  ),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function loadApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  const result = apiEnvSchema.safeParse(env);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(message);
  }

  return {
    OPENAI_API_KEY: result.data.OPENAI_API_KEY,
    OPENAI_BASE_URL: result.data.OPENAI_BASE_URL,
  };
}
