import OpenAI from "openai";
import { getEnv } from "@/lib/env";
import type { TaskCitation, TaskMemoryPreferences, TaskResult } from "@/lib/types";

const globalForOpenAI = globalThis as typeof globalThis & {
  reviveLlmClient?: OpenAI;
  reviveEmbeddingClient?: OpenAI;
};

type ContextChunk = {
  chunkId: string;
  collectionName: string;
  title: string;
  text: string;
  sourceUrl: string | null;
};

const EMBEDDING_BATCH_SIZE = 6;
const INSUFFICIENT_CONTENT_MESSAGE = "当前收藏内容不足以支撑这个任务，建议补充相关内容后再试";

type RawTaskModelResult = {
  recommended_structure?: unknown;
  next_steps?: unknown;
  cautions?: unknown;
  citation_indexes?: unknown;
};

function getClient() {
  if (!globalForOpenAI.reviveLlmClient) {
    const env = getEnv();
    globalForOpenAI.reviveLlmClient = new OpenAI({
      apiKey: env.LLM_API_KEY,
      baseURL: env.LLM_BASE_URL,
    });
  }

  return globalForOpenAI.reviveLlmClient;
}

function getEmbeddingClient() {
  if (!globalForOpenAI.reviveEmbeddingClient) {
    const env = getEnv();
    globalForOpenAI.reviveEmbeddingClient = new OpenAI({
      apiKey: env.EMBEDDING_API_KEY,
      baseURL: env.EMBEDDING_BASE_URL,
    });
  }

  return globalForOpenAI.reviveEmbeddingClient;
}

function sanitizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const result = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  return result.length ? result : fallback;
}

function buildCitation(context: ContextChunk): TaskCitation {
  return {
    collectionName: context.collectionName,
    title: context.title,
    snippet: context.text.slice(0, 220),
    source_url: context.sourceUrl,
  };
}

function buildCitations(contexts: ContextChunk[], indexes: unknown): TaskCitation[] {
  if (!Array.isArray(indexes)) {
    return contexts.slice(0, 3).map(buildCitation);
  }

  const citations: TaskCitation[] = [];
  const seen = new Set<number>();

  for (const value of indexes) {
    if (typeof value !== "number") {
      continue;
    }

    const index = Math.trunc(value);

    if (index < 0 || index >= contexts.length || seen.has(index)) {
      continue;
    }

    seen.add(index);
    citations.push(buildCitation(contexts[index]));
  }

  return citations.length ? citations : contexts.slice(0, 3).map(buildCitation);
}

function emptyPreferences(): TaskMemoryPreferences {
  return {
    memoryIds: [],
    outputStructurePreference: [],
    citationPreference: [],
    expressionPreference: [],
    negativePreferences: [],
  };
}

function formatPreference(values: string[]) {
  return values.length ? values.map((value) => `- ${value}`).join("\n") : "- 无";
}

export async function embedText(input: string) {
  const embeddings = await embedTexts([input]);
  return embeddings[0] ?? [];
}

export async function embedTexts(inputs: string[]) {
  if (!inputs.length) {
    return [];
  }

  const client = getEmbeddingClient();
  const embeddings: number[][] = [];

  for (let index = 0; index < inputs.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = inputs.slice(index, index + EMBEDDING_BATCH_SIZE);
    const response = await client.embeddings.create({
      model: getEnv().EMBEDDING_MODEL,
      input: batch,
      dimensions: getEnv().EMBEDDING_DIMENSIONS,
      encoding_format: "float",
    });

    const batchEmbeddings = response.data
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding ?? []);

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

export async function runTaskWithModel(
  query: string,
  contexts: ContextChunk[],
  preferences: TaskMemoryPreferences = emptyPreferences(),
): Promise<TaskResult> {
  const client = getClient();
  const model = getEnv().LLM_MODEL;
  const contextText = contexts
    .map(
      (context, index) =>
        `[来源${index + 1}] 内容集：${context.collectionName} | 标题：${context.title}\n内容：${context.text}`,
    )
    .join("\n\n");

  const preferenceText = `- 输出结构：
${formatPreference(preferences.outputStructurePreference)}
- 引用偏好：
${formatPreference(preferences.citationPreference)}
- 表达偏好：
${formatPreference(preferences.expressionPreference)}
- 负向约束：
${formatPreference(preferences.negativePreferences)}`;

  const response = await client.chat.completions.create({
    model,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: `你是一个任务助手，专门帮助用户基于他们自己收藏的历史内容，完成当前面临的工作任务。

你必须严格遵守以下规则：
1. 只能基于用户提供的参考内容生成回答，禁止使用外部知识补充或凭空捏造。
2. 如果参考内容不足以支撑回答，直接告知用户「${INSUFFICIENT_CONTENT_MESSAGE}」，不要强行生成。
3. 输出必须结构化，优先使用大纲、步骤、注意事项、风险提示等形式，避免长篇散文式回答。
4. 当参考内容中存在观点冲突时，不要回避冲突，直接给出更适合用户当前任务的方案，并在引用部分说明差异与采信原因。
5. 每一条关键结论必须能追溯到具体的参考内容，不能出现无来源的论断。

你必须只输出一个合法 JSON 对象，不要输出 Markdown，不要输出代码块。JSON 必须包含 recommended_structure、next_steps、cautions、citation_indexes 四个字段。`,
      },
      {
        role: "user",
        content: `[硬约束 - 最高优先级]
用户本次任务：${query}
可用内容集片段：
${contextText}
以上内容中的事实和证据不得与输出矛盾。
若内容集中无足够证据支撑某个结构，不得因偏好强行填充，应标注"依据不足"。

[软约束 - 偏好参考]
该用户的历史偏好（仅供参考，不得覆盖上述硬约束）：
${preferenceText}

[优先级规则]
若本次任务指令与历史偏好冲突，以本次任务指令为准。
若内容证据不足以支撑偏好要求的结构，优先尊重内容证据。

[输出要求]
请基于以上参考内容，针对用户的当前任务，输出结构化结果。
结果中每条关键结论请标注对应的来源编号（如[来源1]）。
如参考内容中存在观点冲突，请按规则处理并在引用区说明。
请严格返回 JSON，格式示例：
${JSON.stringify({
  recommended_structure: ["结论一[来源1]", "结论二[来源2]"],
  next_steps: ["动作一[来源1]", "动作二[来源2]"],
  cautions: [INSUFFICIENT_CONTENT_MESSAGE, "风险提示[来源3]"],
  citation_indexes: [0, 1, 2],
})}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("模型没有返回可解析内容");
  }

  let parsed: RawTaskModelResult;

  try {
    parsed = JSON.parse(content) as RawTaskModelResult;
  } catch {
    throw new Error("模型返回的 JSON 解析失败");
  }

  return {
    recommended_structure: sanitizeStringArray(parsed.recommended_structure, [INSUFFICIENT_CONTENT_MESSAGE]),
    next_steps: sanitizeStringArray(parsed.next_steps, ["补充更多相关收藏内容后再试"]),
    cautions: sanitizeStringArray(parsed.cautions, ["当前结果仅基于已检索到的收藏片段，请核对是否覆盖关键依据"]),
    citations: buildCitations(contexts, parsed.citation_indexes),
  };
}
