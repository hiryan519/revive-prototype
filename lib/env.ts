import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  LLM_API_KEY: z.string().min(1, "LLM_API_KEY is required"),
  LLM_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  LLM_MODEL: z.string().min(1).default("deepseek-chat"),
  DASHSCOPE_API_KEY: z.string().optional(),
  DASHSCOPE_BASE_URL: z.string().url().default("https://dashscope-intl.aliyuncs.com/compatible-mode/v1"),
  EMBEDDING_API_KEY: z.string().optional(),
  EMBEDDING_BASE_URL: z.string().url().default("https://dashscope-intl.aliyuncs.com/compatible-mode/v1"),
  EMBEDDING_MODEL: z.string().min(1).default("text-embedding-v4"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_BASE_URL: process.env.LLM_BASE_URL,
    LLM_MODEL: process.env.LLM_MODEL,
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
    DASHSCOPE_BASE_URL: process.env.DASHSCOPE_BASE_URL,
    EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY,
    EMBEDDING_BASE_URL: process.env.EMBEDDING_BASE_URL,
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
    EMBEDDING_DIMENSIONS: process.env.EMBEDDING_DIMENSIONS,
  });

  cachedEnv = {
    ...parsed,
    EMBEDDING_API_KEY: parsed.DASHSCOPE_API_KEY || parsed.EMBEDDING_API_KEY || "",
    EMBEDDING_BASE_URL: process.env.DASHSCOPE_BASE_URL || parsed.EMBEDDING_BASE_URL,
  };

  if (!cachedEnv.EMBEDDING_API_KEY) {
    throw new Error("DASHSCOPE_API_KEY or EMBEDDING_API_KEY is required");
  }

  return cachedEnv;
}
