"use client";

import { CheckCircle2, FolderOpen, PanelLeftClose, PanelLeftOpen, Plus, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { CollectionDetail, CollectionSummary, TaskResult } from "@/lib/types";
import {
  buildCopyText,
  cx,
  examples,
  ghost,
  panel,
  panelMuted,
  primary,
  readJson,
  secondary,
  shell,
  textarea,
  type ImportMode,
  type ImportSummary,
  type Screen,
} from "@/components/revive/helpers";
import { CollectionsView, DoneView, ImportView } from "@/components/revive/views";

const SIDEBAR_STORAGE_KEY = "revive-home-sidebar-collapsed";
const RETURN_REFRESH_INTERVAL_MS = 5000;

function resolveInitialScreen(initialScreen?: Screen): Screen {
  if (initialScreen === "import" || initialScreen === "collections" || initialScreen === "done" || initialScreen === "result") {
    return initialScreen;
  }

  return "home";
}

function isDatabaseUnavailableMessage(message: string) {
  return message.includes("数据库连接失败");
}

function HomeTaskPanel(props: {
  enabled: boolean;
  totalItems: number;
  taskText: string;
  setTaskText: (value: string) => void;
  runningTask: boolean;
  taskError: string | null;
  canRunTask: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onRunTask: () => void;
  onImport: () => void;
}) {
  const { enabled, totalItems, taskText, setTaskText, runningTask, taskError, canRunTask, textareaRef, onRunTask, onImport } = props;

  return (
    <section className={cx(shell, "px-6 py-6 sm:px-8 sm:py-8")}>
      <div className="mx-auto w-full max-w-[860px]">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-[12px] text-slate-500 shadow-[0_8px_18px_rgba(219,214,232,0.16)]">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {enabled ? "当前基于全部收藏内容" : "请先导入内容，再发起任务"}
          </div>
          <h1 className="mt-6 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 sm:text-[44px]">
            {enabled ? "直接基于全部历史收藏发起任务" : "先把内容收进来，再开始真正的任务"}
          </h1>
          <p className="mx-auto mt-4 max-w-[660px] text-[15px] leading-7 text-slate-600 sm:text-[16px]">
            {enabled
              ? `当前已接入 ${totalItems} 条真实内容，检索范围默认覆盖全部收藏内容。输入任务后，系统会基于真实片段召回、生成结构化结果并返回引用依据。`
              : "导入网页或手动粘贴正文后，Revive 才会基于你的真实收藏内容完成检索、引用和结构化生成。"}
          </p>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,245,250,0.98))] p-4 shadow-[0_24px_60px_rgba(185,176,207,0.2),0_10px_24px_rgba(220,214,235,0.22)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3 px-2">
            <div className="text-[12px] text-slate-400">{enabled ? "当前基于全部收藏内容" : "任务输入将在导入后可用"}</div>
            {!enabled ? (
              <button type="button" onClick={onImport} className={secondary}>
                <Plus className="mr-2 h-4 w-4" />
                导入内容
              </button>
            ) : null}
          </div>

          <textarea
            ref={textareaRef}
            value={taskText}
            disabled={!enabled || runningTask}
            onChange={(event) => setTaskText(event.target.value)}
            placeholder={
              enabled
                ? "例如：基于我收藏的这些发布会复盘、竞品案例和采访内容，整理一版可直接拿去开周会的结构化复盘提纲。"
                : "请先导入内容，再发起任务"
            }
            className={cx(
              textarea,
              "min-h-[220px] border-0 bg-transparent px-2 py-3 text-[16px] shadow-none focus:ring-0 sm:min-h-[260px]",
              !enabled && "cursor-not-allowed text-slate-400 placeholder:text-slate-400",
            )}
          />

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200/70 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {examples.slice(0, 3).map((example) => (
                <button
                  key={example.id}
                  type="button"
                  disabled={!enabled}
                  onClick={() => {
                    setTaskText(example.fill);
                    window.requestAnimationFrame(() => textareaRef.current?.focus());
                  }}
                  className={cx(ghost, "rounded-full px-3 py-2 text-[12px]", !enabled && "cursor-not-allowed opacity-60")}
                >
                  {example.title}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              {!enabled ? (
                <button type="button" onClick={onImport} className={primary}>
                  <Plus className="mr-2 h-4 w-4" />
                  先导入内容
                </button>
              ) : (
                <button type="button" disabled={!canRunTask || runningTask} onClick={onRunTask} className={primary}>
                  {runningTask ? "正在检索并生成" : "发起真实任务"}
                </button>
              )}
            </div>
          </div>
        </div>

        {taskError ? (
          <div className="mt-4 rounded-[18px] border border-rose-200/70 bg-rose-50/92 px-4 py-3 text-[13px] leading-6 text-rose-900 shadow-[0_10px_20px_rgba(245,205,214,0.18)]">
            {taskError}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HomeSidebar(props: {
  collections: CollectionSummary[];
  currentCollectionId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onImport: () => void;
  onOpenCollection: (collectionId: string) => void;
}) {
  const { collections, currentCollectionId, collapsed, onToggle, onImport, onOpenCollection } = props;

  return (
    <aside className={cx("transition-all duration-300 ease-out", collapsed ? "w-0 min-w-0 overflow-hidden opacity-0 xl:w-0" : "w-full xl:w-[320px]")}>
      <section className={cx(panel, "h-full px-4 py-4 sm:px-5 sm:py-5")}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Collections</div>
            <div className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-slate-900">全部内容集</div>
          </div>
          <button type="button" onClick={onToggle} className={ghost}>
            <PanelLeftClose className="mr-2 h-4 w-4" />
            收起侧边栏
          </button>
        </div>

        <button type="button" onClick={onImport} className={cx(primary, "mt-5 w-full")}>
          <Plus className="mr-2 h-4 w-4" />
          导入内容
        </button>

        <div className="mt-5 space-y-3">
          {collections.map((collection) => {
            const active = collection.id === currentCollectionId;

            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => onOpenCollection(collection.id)}
                className={cx(
                  "w-full rounded-[20px] border px-4 py-4 text-left transition",
                  active
                    ? "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,247,238,0.98),rgba(252,240,227,0.94))] shadow-[0_12px_24px_rgba(244,215,185,0.18)]"
                    : "border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,243,250,0.96))] hover:shadow-[0_10px_20px_rgba(219,214,232,0.16)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-slate-900">{collection.name}</div>
                    <div className="mt-2 text-[12px] text-slate-500">{collection.itemCount} 条内容</div>
                  </div>
                  <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

const feedbackOptions = [
  {
    id: "structure",
    label: "结构不适合我",
    dimension: "output_structure",
    value: "不要沿用这次结果的结构方式，后续输出需要更贴合我的任务场景。",
  },
  {
    id: "vague",
    label: "太空泛",
    dimension: "expression_style",
    value: "不要输出空泛概括，关键建议需要更具体、可执行。",
  },
  {
    id: "citation",
    label: "引用不够支撑",
    dimension: "citation_style",
    value: "关键结论需要更充分的引用支撑，并说明引用如何支撑结论。",
  },
  {
    id: "expression",
    label: "表达方式不对",
    dimension: "expression_style",
    value: "调整表达方式，避免不符合我使用习惯的表述。",
  },
] as const;

function ResultFeedback({ taskRunId }: { taskRunId: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [closed, setClosed] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function recordFeedback(rating: "usable" | "unusable") {
    if (!taskRunId) return;

    try {
      await readJson<{ success: true }>("/api/task-feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskRunId, rating }),
      });
    } catch {
      // Feedback logging should not block the preference write flow.
    }
  }

  async function handleUsable() {
    await recordFeedback("usable");
    setExpanded(false);
    setClosed(false);
    setIsError(false);
    setMessage("反馈已记录");
  }

  async function handleUnusable() {
    await recordFeedback("unusable");
    setExpanded(true);
    setClosed(false);
    setMessage(null);
  }

  async function rememberPreference() {
    if (!selected.length || !taskRunId) return;

    setSaving(true);
    setMessage(null);
    setIsError(false);

    const dateText = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const sourceDetail = `${dateText} 任务反馈，任务 ID：${taskRunId}`;

    try {
      const selectedOptions = feedbackOptions.filter((option) => selected.includes(option.id));

      await Promise.all(
        selectedOptions.map((option) =>
          readJson<{ memory: unknown }>("/api/memories", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              scope: "global",
              dimension: option.dimension,
              value: option.value,
              polarity: "negative",
              source: "user_feedback",
              sourceDetail,
            }),
          }),
        ),
      );

      setSelected([]);
      setExpanded(false);
      setMessage("偏好已记住");
    } catch {
      setIsError(true);
      setMessage("写入失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  if (closed) {
    return (
      <section className={cx(panelMuted, "px-5 py-4 text-[13px] text-slate-500")}>
        已收到本次反馈。
      </section>
    );
  }

  return (
    <section className={cx(panelMuted, "px-5 py-5")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Feedback</div>
          <h3 className="mt-2 text-[15px] font-semibold text-slate-900">这次结果对你有用吗？</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void handleUsable()} className={ghost}>
            <ThumbsUp className="mr-2 h-4 w-4" />
            结果可用
          </button>
          <button type="button" onClick={() => void handleUnusable()} className={ghost}>
            <ThumbsDown className="mr-2 h-4 w-4" />
            结果不可用
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-5 border-t border-slate-200/70 pt-5">
          <div className="text-[13px] font-medium text-slate-700">哪里不符合你的习惯？</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {feedbackOptions.map((option) => {
              const active = selected.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setSelected((current) =>
                      current.includes(option.id)
                        ? current.filter((item) => item !== option.id)
                        : [...current, option.id],
                    )
                  }
                  className={cx(
                    "rounded-full border px-3 py-2 text-[13px] transition",
                    active
                      ? "border-amber-200/80 bg-amber-50 text-amber-800 shadow-[0_8px_16px_rgba(245,220,180,0.18)]"
                      : "border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900",
                  )}
                >
                  {active ? <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" /> : null}
                  {option.label}
                </button>
              );
            })}
          </div>

          {selected.length ? (
            <div className="mt-5 rounded-[18px] border border-slate-200/80 bg-white/75 px-4 py-4 shadow-[0_10px_20px_rgba(219,214,232,0.14)]">
              <div className="text-[13px] leading-6 text-slate-600">要让 Revive 记住这个偏好吗？确认后会写入“我的偏好”。</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" disabled={saving} onClick={() => void rememberPreference()} className={primary}>
                  {saving ? "正在写入" : "记住这个偏好"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setExpanded(false);
                    setClosed(true);
                    setSelected([]);
                  }}
                  className={secondary}
                >
                  仅此一次，不记住
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <div
          className={cx(
            "mt-4 rounded-[16px] border px-4 py-3 text-[13px] leading-6",
            isError
              ? "border-rose-200/70 bg-rose-50/92 text-rose-900"
              : "border-emerald-200/70 bg-emerald-50/92 text-emerald-800",
          )}
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}

function ResultPanel(props: {
  taskText: string;
  taskRunId: string | null;
  taskResult: TaskResult;
  copied: boolean;
  refOpen: boolean;
  setRefOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  onBack: () => void;
  onCopy: () => void;
}) {
  const { taskText, taskRunId, taskResult, copied, refOpen, setRefOpen, onBack, onCopy } = props;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={ghost}>返回工作台</button>
        <button type="button" onClick={onCopy} className={primary}>{copied ? "已复制结果" : "复制结果"}</button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_340px]">
        <section className={cx(shell, "px-6 py-6 sm:px-7 sm:py-7")}>
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Current Task</div>
            <div className="mt-3 rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,241,250,0.97))] px-5 py-4 shadow-[0_10px_22px_rgba(219,214,232,0.16)]">
              <div className="text-[16px] leading-8 text-slate-700">{taskText}</div>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <section className={cx(panel, "px-5 py-5")}>
              <h3 className="text-[15px] font-semibold text-slate-900">推荐结构</h3>
              <div className="mt-4 space-y-3">
                {taskResult.recommended_structure.map((item, index) => (
                  <div key={`${item}-${index}`} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-violet-200/70 bg-[linear-gradient(180deg,rgba(233,220,255,0.92),rgba(220,202,255,0.9))] text-[12px] font-semibold text-violet-700 shadow-[0_6px_14px_rgba(215,196,246,0.2)]">{index + 1}</div>
                    <p className="text-[15px] leading-8 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={cx(panelMuted, "px-5 py-5")}>
              <h3 className="text-[15px] font-semibold text-slate-900">下一步建议</h3>
              <div className="mt-4 space-y-3">
                {taskResult.next_steps.map((item, index) => (
                  <div key={`${item}-${index}`} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,241,250,0.96))] text-[12px] font-semibold text-slate-600 shadow-[0_6px_14px_rgba(219,214,232,0.16)]">{index + 1}</div>
                    <p className="text-[15px] leading-8 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={cx(panelMuted, "px-5 py-5")}>
              <h3 className="text-[15px] font-semibold text-slate-900">注意事项</h3>
              <div className="mt-4 space-y-3">
                {taskResult.cautions.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-[18px] border border-amber-200/50 bg-[linear-gradient(180deg,rgba(255,248,236,0.96),rgba(255,242,225,0.92))] px-4 py-4 shadow-[0_8px_18px_rgba(245,220,180,0.18)]">
                    <p className="text-[14px] leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <aside className="space-y-4">
          <section className={cx(panel, "px-5 py-5")}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Context</div>
            <div className="mt-3 rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="text-[13px] text-slate-400">当前检索范围</div>
              <div className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-violet-500" />
                全部收藏内容
              </div>
              <p className="mt-2 text-[13px] leading-6 text-slate-500">结果默认基于全部收藏内容中召回的真实片段生成。</p>
            </div>
          </section>

          <section className={cx(panelMuted, "px-5 py-5")}>
            <button type="button" onClick={() => setRefOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Evidence</div>
                <div className="mt-2 text-[15px] font-semibold text-slate-900">引用依据</div>
                <div className="mt-1 text-[12px] text-slate-400">每条引用都带上所属内容集与原始来源。</div>
              </div>
              <div className="text-[12px] text-slate-400">{refOpen ? "收起" : "展开"}</div>
            </button>

            {refOpen ? (
              <div className="mt-4 space-y-2">
                {taskResult.citations.map((citation, index) => (
                  <div key={`${citation.collectionName}-${citation.title}-${index}`} className="rounded-[16px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-[12px] text-slate-400">内容集：{citation.collectionName}</div>
                    <div className="mt-1 text-[13px] font-semibold text-slate-900">{citation.title}</div>
                    <p className="mt-2 text-[12px] leading-6 text-slate-500">{citation.snippet}</p>
                    <p className="mt-2 text-[12px] text-slate-400">{citation.source_url || "手动粘贴正文导入"}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      <ResultFeedback taskRunId={taskRunId} />
    </div>
  );
}

export function ReviveHome({ initialScreen }: { initialScreen?: Screen }) {
  const formatter = useMemo(() => new Intl.NumberFormat("zh-CN"), []);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [screen, setScreen] = useState<Screen>(resolveInitialScreen(initialScreen));
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [currentCollectionId, setCurrentCollectionId] = useState<string | null>(null);
  const [currentCollection, setCurrentCollection] = useState<CollectionDetail | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("link");
  const [collectionName, setCollectionName] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [taskText, setTaskText] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);
  const [runningTask, setRunningTask] = useState(false);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [taskRunId, setTaskRunId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [renamingCollection, setRenamingCollection] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const didInitialLoadRef = useRef(false);
  const lastReturnRefreshRef = useRef(0);

  const currentSummary = collections.find((collection) => collection.id === currentCollectionId) ?? collections[0] ?? null;
  const hasImportedContent = collections.some((collection) => collection.itemCount > 0);
  const totalItems = collections.reduce((sum, collection) => sum + collection.itemCount, 0);

  const loadCollectionDetail = useCallback(async (collectionId: string) => {
    const payload = await readJson<{ collection: CollectionDetail }>(`/api/collections/${collectionId}`);
    setCurrentCollection(payload.collection);
    setCurrentCollectionId(collectionId);
  }, []);

  const loadCollections = useCallback(
    async (nextCollectionId?: string, options?: { silent?: boolean }) => {
      const silent = options?.silent === true;

      if (!silent) {
        setLoadingCollections(true);
        setPageError(null);
      }

      try {
        const payload = await readJson<{ collections: CollectionSummary[] }>("/api/collections");
        const list = payload.collections;
        setDatabaseUnavailable(false);
        setCollections(list);

        const pickedId = nextCollectionId ?? currentCollectionId ?? list[0]?.id ?? null;
        setCurrentCollectionId(pickedId);

        if (!list.length) {
          setCurrentCollection(null);
          setScreen((current) => (current === "import" ? current : "home"));
        } else if (pickedId) {
          await loadCollectionDetail(pickedId);
        }
      } catch (error) {
        if (silent) return;

        const message = error instanceof Error ? error.message : "读取内容集失败";

        if (isDatabaseUnavailableMessage(message)) {
          setDatabaseUnavailable(true);
          setCollections([]);
          setCurrentCollection(null);
          setCurrentCollectionId(null);
          setScreen((current) => (current === "import" ? current : "home"));
          return;
        }

        setPageError(message);
      } finally {
        if (!options?.silent) {
          setLoadingCollections(false);
        }
      }
    },
    [currentCollectionId, loadCollectionDetail],
  );

  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    void loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    function refreshOnReturn() {
      const now = Date.now();
      if (now - lastReturnRefreshRef.current < RETURN_REFRESH_INTERVAL_MS) return;
      lastReturnRefreshRef.current = now;
      void loadCollections(currentCollectionId ?? undefined, { silent: true });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshOnReturn();
      }
    }

    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentCollectionId, loadCollections]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "1") {
        setSidebarCollapsed(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? "1" : "0");
    } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (screen !== "import") return;
    if (!currentSummary?.name) return;
    if (collectionName.trim()) return;
    setCollectionName(currentSummary.name);
  }, [screen, currentSummary, collectionName]);

  function resetImportInputs() {
    setUrlValue("");
    setManualTitle("");
    setManualValue("");
    setImportError(null);
    setShowFallback(false);
  }

  async function handleImport(mode: ImportMode) {
    const hadImportedBefore = hasImportedContent;

    setImportMode(mode);
    setImporting(true);
    setImportError(null);

    try {
      const endpoint = mode === "link" ? "/api/import-url" : "/api/import-text";
      const body = mode === "link" ? { collectionName, url: urlValue } : { collectionName, title: manualTitle, content: manualValue };

      const payload = await readJson<ImportSummary & { success: true }>(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      setImportSummary(payload);
      resetImportInputs();
      await loadCollections(payload.collectionId);
      setScreen(hadImportedBefore ? "done" : "home");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "导入失败");
      if (mode === "link") setShowFallback(true);
    } finally {
      setImporting(false);
    }
  }

  async function handleRunTask() {
    if (!hasImportedContent) {
      setTaskError("请先导入内容，再发起任务");
      return;
    }

    setRunningTask(true);
    setTaskError(null);
    setTaskResult(null);
    setTaskRunId(null);

    try {
      const payload = await readJson<{ success: true; taskRunId: string; result: TaskResult }>("/api/run-task", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collectionId: currentCollectionId ?? collections[0]?.id, query: taskText }),
      });
      setTaskResult(payload.result);
      setTaskRunId(payload.taskRunId);
      setRefOpen(false);
      setScreen("result");
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "任务执行失败");
    } finally {
      setRunningTask(false);
    }
  }

  async function handleCopyResult() {
    if (!taskResult) return;

    try {
      await navigator.clipboard.writeText(buildCopyText(taskResult));
      setCopied(true);
    } catch {
      setTaskError("复制失败，请检查浏览器剪贴板权限");
    }
  }

  async function handleRenameCollection(name: string) {
    if (!currentCollectionId) {
      throw new Error("请先选择内容集");
    }

    setRenamingCollection(true);
    try {
      const previousName = currentCollection?.name ?? currentSummary?.name ?? "";
      const payload = await readJson<{ collection: CollectionSummary }>(`/api/collections/${currentCollectionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });

      setCollections((current) => current.map((collection) => (collection.id === currentCollectionId ? { ...collection, ...payload.collection } : collection)));
      setCurrentCollection((current) =>
        current && current.id === currentCollectionId ? { ...current, name: payload.collection.name, updatedAt: payload.collection.updatedAt } : current,
      );
      setCollectionName((current) => {
        const trimmed = current.trim();
        if (!trimmed || trimmed === previousName) {
          return payload.collection.name;
        }
        return current;
      });
    } finally {
      setRenamingCollection(false);
    }
  }

  async function handleDeleteCollection() {
    if (!currentCollectionId) {
      throw new Error("请先选择内容集");
    }

    setDeletingCollection(true);
    try {
      await readJson<{ success: true }>(`/api/collections/${currentCollectionId}`, { method: "DELETE" });

      const remaining = collections.filter((collection) => collection.id !== currentCollectionId);
      setCollections(remaining);
      setCurrentCollection(null);
      setCurrentCollectionId(remaining[0]?.id ?? null);
      setScreen(remaining.length ? "collections" : "home");

      if (remaining[0]?.id) {
        await loadCollectionDetail(remaining[0].id);
      }
    } finally {
      setDeletingCollection(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    setDeletingItemId(itemId);
    try {
      await readJson<{ success: true }>(`/api/items/${itemId}`, { method: "DELETE" });
      setCurrentCollection((current) => {
        if (!current) return current;
        const items = current.items.filter((item) => item.id !== itemId);
        const nextCount = Math.max(0, current.itemCount - 1);
        return {
          ...current,
          itemCount: nextCount,
          items,
        };
      });
      setCollections((current) =>
        current.map((collection) =>
          collection.id === currentCollectionId ? { ...collection, itemCount: Math.max(0, collection.itemCount - 1) } : collection,
        ),
      );
    } finally {
      setDeletingItemId(null);
    }
  }

  return (
    <div className="min-h-screen text-slate-900">
      <main className="mx-auto w-full max-w-[1480px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {pageError ? (
          <div className="mb-6 rounded-[18px] border border-amber-200/70 bg-amber-50/90 px-4 py-3 text-[14px] leading-6 text-amber-900 shadow-[0_10px_20px_rgba(245,220,180,0.16)]">{pageError}</div>
        ) : null}

        {databaseUnavailable ? (
          <div className="mb-6 rounded-[18px] border border-slate-200/80 bg-white/80 px-4 py-3 text-[13px] leading-6 text-slate-500 shadow-[0_8px_18px_rgba(219,214,232,0.14)]">
            当前数据库暂未连通，页面先按未导入状态展示。修正 `.env.local` 里的 `DATABASE_URL` 后刷新即可恢复真实数据。
          </div>
        ) : null}

        {screen === "home" ? (
          loadingCollections ? (
            <section className={cx(shell, "px-6 py-8 text-center text-[15px] text-slate-500")}>正在加载真实内容…</section>
          ) : hasImportedContent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Revive Workspace</div>
                  <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.05em] text-slate-900">全部收藏内容工作台</h2>
                </div>
                <button type="button" onClick={() => setSidebarCollapsed((current) => !current)} className={ghost}>
                  {sidebarCollapsed ? <PanelLeftOpen className="mr-2 h-4 w-4" /> : <PanelLeftClose className="mr-2 h-4 w-4" />}
                  {sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
                </button>
              </div>

              <div className="grid gap-6 xl:grid-cols-[auto_minmax(0,1fr)]">
                <HomeSidebar
                  collections={collections}
                  currentCollectionId={currentCollectionId}
                  collapsed={sidebarCollapsed}
                  onToggle={() => setSidebarCollapsed(true)}
                  onImport={() => setScreen("import")}
                  onOpenCollection={(collectionId) => {
                    void loadCollectionDetail(collectionId);
                    setScreen("collections");
                  }}
                />
                <HomeTaskPanel
                  enabled
                  totalItems={totalItems}
                  taskText={taskText}
                  setTaskText={setTaskText}
                  runningTask={runningTask}
                  taskError={taskError}
                  canRunTask={Boolean(taskText.trim())}
                  textareaRef={textareaRef}
                  onRunTask={handleRunTask}
                  onImport={() => setScreen("import")}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
              <HomeTaskPanel
                enabled={false}
                totalItems={0}
                taskText={taskText}
                setTaskText={setTaskText}
                runningTask={false}
                taskError={taskError}
                canRunTask={false}
                textareaRef={textareaRef}
                onRunTask={handleRunTask}
                onImport={() => setScreen("import")}
              />
            </div>
          )
        ) : null}

        {screen === "import" ? (
          <ImportView
            currentSummary={currentSummary}
            collectionName={collectionName}
            setCollectionName={setCollectionName}
            urlValue={urlValue}
            setUrlValue={setUrlValue}
            manualTitle={manualTitle}
            setManualTitle={setManualTitle}
            manualValue={manualValue}
            setManualValue={setManualValue}
            importing={importing}
            importMode={importMode}
            importError={importError}
            showFallback={showFallback}
            setShowFallback={setShowFallback}
            canSubmitLink={Boolean(collectionName.trim() && urlValue.trim())}
            canSubmitText={Boolean(collectionName.trim() && manualTitle.trim() && manualValue.trim().length >= 80)}
            onBack={() => setScreen("home")}
            onCollections={() => setScreen("collections")}
            onImport={handleImport}
          />
        ) : null}

        {screen === "done" && importSummary && currentSummary ? (
          <DoneView importSummary={importSummary} currentSummary={currentSummary} formatter={formatter} onCollections={() => setScreen("collections")} onInput={() => setScreen("home")} />
        ) : null}

        {screen === "collections" ? (
          <CollectionsView
            collections={collections}
            currentCollectionId={currentCollectionId}
            currentCollection={currentCollection}
            formatter={formatter}
            renamingCollection={renamingCollection}
            deletingCollection={deletingCollection}
            deletingItemId={deletingItemId}
            onBack={() => setScreen("home")}
            onImport={() => setScreen("import")}
            onInput={() => setScreen("home")}
            onRenameCollection={handleRenameCollection}
            onDeleteCollection={handleDeleteCollection}
            onDeleteItem={handleDeleteItem}
            onSelect={(collectionId) => {
              void loadCollectionDetail(collectionId);
            }}
          />
        ) : null}

        {screen === "result" && taskResult ? (
          <ResultPanel taskText={taskText} taskRunId={taskRunId} taskResult={taskResult} copied={copied} refOpen={refOpen} setRefOpen={setRefOpen} onBack={() => setScreen("home")} onCopy={() => { void handleCopyResult(); }} />
        ) : null}
      </main>
    </div>
  );
}
