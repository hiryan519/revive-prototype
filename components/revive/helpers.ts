import type { CollectionDetail, CollectionSummary, TaskResult } from "@/lib/types";

export type Screen = "home" | "import" | "done" | "collections" | "input" | "result";
export type ImportMode = "link" | "paste";
export type ImportSummary = {
  collectionId: string;
  itemId: string;
  title: string;
  contentLength: number;
  chunkCount: number;
  deduped?: boolean;
};

export const examples = [
  {
    id: "review",
    title: "复盘结构",
    fill: "基于我收藏的这些历史内容，整理一版适合团队复用的项目复盘结构，包含背景、关键偏差、原因拆解和后续动作。",
  },
  {
    id: "plan",
    title: "执行方案",
    fill: "请基于这些收藏内容，生成一版可复用的执行方案框架，包含目标、核心策略、步骤、资源和风险预案。",
  },
  {
    id: "report",
    title: "汇报提纲",
    fill: "请基于当前全部收藏内容，提炼一版汇报提纲，突出最值得被记住的结论、关键依据和后续推进建议。",
  },
];

export const shell =
  "relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,244,252,0.96))] shadow-[0_24px_60px_rgba(185,176,207,0.24),0_8px_24px_rgba(220,214,235,0.34),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-16 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.8),transparent)]";
export const panel =
  "relative overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,242,251,0.96))] shadow-[0_20px_46px_rgba(194,187,214,0.2),0_6px_18px_rgba(222,217,235,0.34),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-lg before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-12 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.78),transparent)]";
export const panelMuted =
  "relative overflow-hidden rounded-[22px] border border-white/65 bg-[linear-gradient(180deg,rgba(251,249,255,0.92),rgba(243,239,248,0.95))] shadow-[0_16px_34px_rgba(200,193,220,0.18),0_4px_14px_rgba(227,222,238,0.32),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-10 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.7),transparent)]";
export const primary =
  "relative overflow-hidden inline-flex items-center justify-center rounded-[16px] border border-violet-200/70 bg-[linear-gradient(180deg,rgba(171,92,255,0.94),rgba(133,59,229,0.98))] px-5 py-3 text-[14px] font-medium text-white shadow-[0_16px_30px_rgba(166,109,255,0.3),0_8px_18px_rgba(194,150,255,0.26),inset_0_1px_0_rgba(243,226,255,0.5)] transition duration-200 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.24),transparent)] hover:bg-[linear-gradient(180deg,rgba(178,102,255,0.96),rgba(140,66,235,1))] hover:shadow-[0_18px_34px_rgba(166,109,255,0.34),0_10px_20px_rgba(194,150,255,0.28),inset_0_1px_0_rgba(243,226,255,0.56)] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:before:hidden";
export const secondary =
  "relative overflow-hidden inline-flex items-center justify-center rounded-[16px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,240,251,0.96))] px-5 py-3 text-[14px] font-medium text-slate-700 shadow-[0_8px_18px_rgba(219,214,232,0.32),inset_0_1px_0_rgba(255,255,255,0.85)] transition duration-200 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent)] hover:text-slate-900 hover:shadow-[0_10px_20px_rgba(219,214,232,0.38),inset_0_1px_0_rgba(255,255,255,0.92)]";
export const ghost =
  "relative overflow-hidden inline-flex items-center justify-center rounded-[14px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(245,241,250,0.94))] px-4 py-2.5 text-[13px] font-medium text-slate-600 shadow-[0_6px_14px_rgba(219,214,232,0.22),inset_0_1px_0_rgba(255,255,255,0.8)] transition duration-200 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent)] hover:text-slate-900 hover:shadow-[0_8px_16px_rgba(219,214,232,0.26),inset_0_1px_0_rgba(255,255,255,0.88)]";
export const field =
  "w-full rounded-[18px] border border-slate-200/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,241,250,0.96))] px-4 py-3 text-[15px] text-slate-900 shadow-[0_8px_16px_rgba(224,219,235,0.26),inset_0_1px_0_rgba(255,255,255,0.84)] outline-none transition placeholder:text-slate-400 focus:border-violet-200/80 focus:ring-2 focus:ring-violet-200/45";
export const textarea =
  "w-full resize-none rounded-[22px] border border-slate-200/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,241,250,0.96))] px-5 py-4 text-[15px] leading-8 text-slate-900 shadow-[0_10px_18px_rgba(224,219,235,0.28),inset_0_1px_0_rgba(255,255,255,0.84)] outline-none transition placeholder:text-slate-400 focus:border-violet-200/80 focus:ring-2 focus:ring-violet-200/45";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "请求失败");
  return payload;
}

export function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function buildCopyText(result: TaskResult) {
  return [
    "推荐结构",
    ...result.recommended_structure.map((item, index) => `${index + 1}. ${item}`),
    "",
    "后续步骤",
    ...result.next_steps.map((item, index) => `${index + 1}. ${item}`),
    "",
    "注意事项",
    ...result.cautions.map((item) => `- ${item}`),
    "",
    "引用依据",
    ...result.citations.map(
      (item, index) =>
        `${index + 1}. [${item.collectionName}] ${item.title}\n${item.snippet}\n${item.source_url ?? "手动粘贴正文导入"}`,
    ),
  ].join("\n");
}

export function getCollectionUseCases(collection: CollectionDetail | CollectionSummary | null) {
  if (!collection) {
    return "用于把已有内容转成当前任务可直接复用的结构化结果。";
  }

  const text = `${collection.name} ${collection.description ?? ""}`;

  if (text.includes("复盘")) {
    return "适合做复盘、复用方案和经验沉淀类任务。";
  }

  if (text.includes("方案") || text.includes("策划") || text.includes("产品")) {
    return "适合做执行方案、策略框架和结构化提纲类任务。";
  }

  if (text.includes("汇报") || text.includes("发布") || text.includes("案例")) {
    return "适合做汇报提纲、表达结构和对外输出类任务。";
  }

  return "适合把这批历史内容快速转成当前任务可直接带走的结果。";
}
