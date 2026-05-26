"use client";

import { AlertCircle, ArrowLeft, ChevronRight, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { CollectionDetail, CollectionSummary } from "@/lib/types";
import {
  cx,
  field,
  formatDate,
  getCollectionUseCases,
  ghost,
  panel,
  panelMuted,
  primary,
  secondary,
  shell,
  textarea,
  type ImportMode,
  type ImportSummary,
} from "@/components/revive/helpers";

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{children}</div>;
}

function MetricChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.024))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-10px_16px_rgba(0,0,0,0.1)]">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-[18px] font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function ToolHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="返回"
          onClick={onBack}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,241,250,0.95))] text-slate-700 shadow-[0_8px_16px_rgba(219,214,232,0.24),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Revive Workspace</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">{title}</h1>
            {subtitle ? <span className="text-[13px] text-slate-500">{subtitle}</span> : null}
          </div>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

function CollectionOption({
  collection,
  active,
  onClick,
}: {
  collection: CollectionSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-[22px] border px-4 py-4 text-left transition",
        active
          ? "border-orange-200/14 bg-[linear-gradient(180deg,rgba(214,136,91,0.09),rgba(214,136,91,0.04))] shadow-[0_18px_42px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,240,230,0.05)]"
          : "border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/12 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-slate-900">{collection.name}</div>
          <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-slate-500">
            {collection.description || "还没有补充内容集描述。"}
          </p>
        </div>
        <div className="rounded-full border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,241,250,0.96))] px-3 py-1 text-[12px] font-medium text-slate-600 shadow-[0_6px_14px_rgba(219,214,232,0.18)]">
          {collection.itemCount}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-[12px] text-slate-400">
        <span>更新于 {formatDate(collection.updatedAt)}</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
}

export function ImportView(props: {
  currentSummary: CollectionSummary | null;
  collectionName: string;
  setCollectionName: (value: string) => void;
  urlValue: string;
  setUrlValue: (value: string) => void;
  manualTitle: string;
  setManualTitle: (value: string) => void;
  manualValue: string;
  setManualValue: (value: string) => void;
  importing: boolean;
  importMode: ImportMode;
  importError: string | null;
  showFallback: boolean;
  setShowFallback: (value: boolean) => void;
  canSubmitLink: boolean;
  canSubmitText: boolean;
  onBack: () => void;
  onCollections: () => void;
  onImport: (mode: ImportMode) => void;
}) {
  const {
    currentSummary,
    collectionName,
    setCollectionName,
    urlValue,
    setUrlValue,
    manualTitle,
    setManualTitle,
    manualValue,
    setManualValue,
    importing,
    importMode,
    importError,
    showFallback,
    setShowFallback,
    canSubmitLink,
    canSubmitText,
    onBack,
    onCollections,
    onImport,
  } = props;

  return (
    <>
      <ToolHeader
        title="导入内容"
        subtitle="优先链接导入，正文作为兜底"
        onBack={onBack}
        action={
          currentSummary ? (
            <button type="button" onClick={onCollections} className={ghost}>
              当前内容集：{currentSummary.name}
            </button>
          ) : null
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <section className={cx(shell, "px-7 py-7")}>
          <SectionLabel>Import Setup</SectionLabel>
          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div className={cx(panel, "px-5 py-5")}>
              <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-slate-900">网页链接导入</h2>
              <p className="mt-2 text-[14px] leading-6 text-slate-600">作为主入口使用，适合桌面端工作流。后续浏览器插件也会承接这里的导入路径。</p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-slate-700">导入到哪个内容集</label>
                  <input
                    value={collectionName}
                    onChange={(event) => setCollectionName(event.target.value)}
                    placeholder={currentSummary ? `默认使用当前内容集：${currentSummary.name}` : "例如：产品方案 / 竞品案例 / 发布会素材"}
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-slate-700">网页链接</label>
                  <input
                    value={urlValue}
                    onChange={(event) => setUrlValue(event.target.value)}
                    placeholder="粘贴网页链接，例如 https://example.com/article"
                    className={field}
                  />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" disabled={!canSubmitLink || importing} onClick={() => onImport("link")} className={primary}>
                  {importing && importMode === "link" ? "正在导入链接" : "导入这个链接"}
                </button>
                <button type="button" onClick={() => setShowFallback(true)} className={secondary}>
                  解析失败时改用正文导入
                </button>
              </div>
            </div>
            <div className={cx(panelMuted, "px-5 py-5")}>
              <SectionLabel>Fallback</SectionLabel>
              <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.04em] text-slate-900">手动粘贴正文继续导入</h3>
              <p className="mt-2 text-[14px] leading-6 text-slate-600">这是兜底路径，不和主入口争主轴，但能保证导入闭环不中断。</p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-slate-700">标题</label>
                  <input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} placeholder="给这段正文一个标题" className={field} />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-slate-700">正文内容</label>
                  <textarea
                    value={manualValue}
                    onChange={(event) => setManualValue(event.target.value)}
                    placeholder="粘贴真实正文，至少 80 个字"
                    className={cx(textarea, "min-h-[220px]")}
                  />
                </div>
              </div>
              {showFallback ? (
                <div className="mt-4 rounded-[18px] border border-amber-200/70 bg-amber-50/92 px-4 py-3 text-[13px] leading-6 text-amber-900 shadow-[0_10px_20px_rgba(245,220,180,0.16)]">
                  <AlertCircle className="mr-2 inline h-4 w-4" />
                  链接解析失败后，下一步就是粘贴正文继续导入，不会静默失败。
                </div>
              ) : null}
              <button type="button" disabled={!canSubmitText || importing} onClick={() => onImport("paste")} className={cx(primary, "mt-5 w-full")}>
                {importing && importMode === "paste" ? "正在导入正文" : "导入正文"}
              </button>
            </div>
          </div>
          {importError ? (
            <div className="mt-5 rounded-[18px] border border-rose-200/70 bg-rose-50/92 px-4 py-3 text-[13px] leading-6 text-rose-900 shadow-[0_10px_20px_rgba(245,205,214,0.18)]">
              {importError}
            </div>
          ) : null}
        </section>
        <aside className={cx(panel, "px-5 py-6")}>
          <SectionLabel>Import Notes</SectionLabel>
          <div className="mt-4 space-y-3 text-[14px] leading-6 text-slate-600">
            <div className="rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">先用网页链接导入，保留最顺手的桌面工作流。</div>
            <div className="rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">解析失败再切正文兜底，不让真实导入链路断掉。</div>
            <div className="rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">导入完成后，直接进入内容集判断是否适合当前任务。</div>
          </div>
        </aside>
      </div>
    </>
  );
}

export function DoneView({
  importSummary,
  currentSummary,
  formatter,
  onCollections,
  onInput,
}: {
  importSummary: ImportSummary;
  currentSummary: CollectionSummary;
  formatter: Intl.NumberFormat;
  onCollections: () => void;
  onInput: () => void;
}) {
  return (
    <>
      <ToolHeader title="导入完成" subtitle="内容已进入真实检索链路" onBack={onCollections} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className={cx(shell, "px-7 py-7")}>
          <h2 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">{importSummary.deduped ? "内容已并入现有内容集" : "真实导入已经完成"}</h2>
          <p className="mt-3 max-w-[64ch] text-[15px] leading-7 text-slate-600">内容已写入数据库，并已切块、可检索。你可以直接基于这个内容集发起任务，拿到结构化结果和引用依据。</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetricChip label="内容集" value={currentSummary.name} />
            <MetricChip label="条目字数" value={formatter.format(importSummary.contentLength)} />
            <MetricChip label="切块数量" value={formatter.format(importSummary.chunkCount)} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onInput} className={primary}>基于这个内容集发起任务</button>
            <button type="button" onClick={onCollections} className={secondary}>查看内容集详情</button>
          </div>
        </section>
        <aside className={cx(panel, "px-5 py-6")}>
          <SectionLabel>Next</SectionLabel>
          <div className="mt-4 rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 text-[14px] leading-6 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">先判断这批内容是否适合当前任务，再进入输入页生成可直接带走的结果。</div>
        </aside>
      </div>
    </>
  );
}

export function CollectionsView(props: {
  collections: CollectionSummary[];
  currentCollectionId: string | null;
  currentCollection: CollectionDetail | null;
  formatter: Intl.NumberFormat;
  renamingCollection: boolean;
  deletingCollection: boolean;
  deletingItemId: string | null;
  onBack: () => void;
  onImport: () => void;
  onInput: () => void;
  onRenameCollection: (name: string) => Promise<void>;
  onDeleteCollection: () => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onSelect: (collectionId: string) => void;
}) {
  const {
    collections,
    currentCollectionId,
    currentCollection,
    formatter,
    renamingCollection,
    deletingCollection,
    deletingItemId,
    onBack,
    onImport,
    onInput,
    onRenameCollection,
    onDeleteCollection,
    onDeleteItem,
    onSelect,
  } = props;
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [collectionActionError, setCollectionActionError] = useState<string | null>(null);

  async function submitRename() {
    const nextName = editingName.trim();

    if (!currentCollection || !nextName || nextName === currentCollection.name) {
      setIsEditingName(false);
      setEditingName(currentCollection?.name ?? "");
      return;
    }

    try {
      setCollectionActionError(null);
      await onRenameCollection(nextName);
      setIsEditingName(false);
    } catch (error) {
      setCollectionActionError(error instanceof Error ? error.message : "保存内容集名称失败");
    }
  }

  async function confirmDeleteCollection() {
    if (!window.confirm("删除后将移除该内容集及所有内容，无法恢复，是否确认？")) {
      return;
    }

    try {
      setCollectionActionError(null);
      await onDeleteCollection();
    } catch (error) {
      setCollectionActionError(error instanceof Error ? error.message : "删除内容集失败");
    }
  }

  async function confirmDeleteItem(itemId: string) {
    if (!window.confirm("确认删除这条内容？")) {
      return;
    }

    try {
      setCollectionActionError(null);
      await onDeleteItem(itemId);
    } catch (error) {
      setCollectionActionError(error instanceof Error ? error.message : "删除内容失败");
    }
  }

  return (
    <>
      <ToolHeader
        title="内容集"
        subtitle="先判断能不能用，再发起任务"
        onBack={onBack}
        action={
          <button type="button" onClick={onImport} className={secondary}>
            <Plus className="mr-2 h-4 w-4" />
            导入新内容
          </button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className={cx(panel, "px-5 py-5")}>
          <SectionLabel>Collections</SectionLabel>
          <div className="mt-3 text-[22px] font-semibold tracking-[-0.04em] text-slate-50">选择当前任务的检索范围</div>
          <div className="mt-5 space-y-3">
            {collections.map((collection) => (
              <CollectionOption key={collection.id} collection={collection} active={collection.id === currentCollectionId} onClick={() => onSelect(collection.id)} />
            ))}
          </div>
        </section>
        <section className={cx(shell, "px-7 py-7")}>
          {currentCollection ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <SectionLabel>Current Collection</SectionLabel>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {isEditingName ? (
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        onBlur={() => {
                          void submitRename();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void submitRename();
                          }
                          if (event.key === "Escape") {
                            setIsEditingName(false);
                            setEditingName(currentCollection.name);
                          }
                        }}
                        disabled={renamingCollection}
                        className={cx(field, "h-12 max-w-[420px] text-[28px] font-semibold tracking-[-0.05em]")}
                        autoFocus
                      />
                    ) : (
                      <>
                        <h2 className="text-[30px] font-semibold tracking-[-0.05em] text-slate-900">{currentCollection.name}</h2>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingName(currentCollection.name);
                            setCollectionActionError(null);
                            setIsEditingName(true);
                          }}
                          disabled={renamingCollection}
                          className={ghost}
                          aria-label="编辑内容集名称"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="mt-3 max-w-[64ch] text-[15px] leading-7 text-slate-600">{currentCollection.description || "当前未填写描述。你可以先看适用任务和预览，再决定是否基于它发起任务。"}</p>
                </div>
                <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                  <MetricChip label="条目数" value={formatter.format(currentCollection.itemCount)} />
                  <MetricChip label="最近更新" value={formatDate(currentCollection.updatedAt)} />
                </div>
              </div>
              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_320px]">
                <div className={cx(panelMuted, "px-5 py-5")}>
                  <SectionLabel>Use Fit</SectionLabel>
                  <div className="mt-3 text-[18px] font-semibold text-slate-900">适合做什么任务</div>
                  <p className="mt-3 text-[14px] leading-7 text-slate-600">{getCollectionUseCases(currentCollection)}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={onInput} className={primary}>基于这些内容发起任务</button>
                    <button type="button" onClick={onImport} className={secondary}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      继续导入
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void confirmDeleteCollection();
                      }}
                      disabled={deletingCollection}
                      className={ghost}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingCollection ? "删除中" : "删除内容集"}
                    </button>
                  </div>
                </div>
                <div className={cx(panelMuted, "px-5 py-5")}>
                  <SectionLabel>Decision Hint</SectionLabel>
                  <div className="mt-3 rounded-[18px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,241,250,0.97))] px-4 py-4 text-[14px] leading-7 text-slate-600 shadow-[0_10px_20px_rgba(219,214,232,0.16)]">如果这批内容已经覆盖你的任务背景、关键案例和可引用证据，就可以直接发任务；如果还缺上下文，再补充导入。</div>
                </div>
              </div>
              <div className="mt-8">
                {collectionActionError ? (
                  <div className="mb-4 rounded-[18px] border border-rose-200/70 bg-rose-50/92 px-4 py-3 text-[13px] leading-6 text-rose-900 shadow-[0_10px_20px_rgba(245,205,214,0.18)]">{collectionActionError}</div>
                ) : null}
                <div className="mb-3 text-[14px] font-semibold text-slate-800">内容预览</div>
                <div className="space-y-3">
                  {currentCollection.items.length ? (
                    currentCollection.items.map((item) => (
                      <div key={item.id} className="rounded-[20px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[15px] font-semibold text-slate-900">{item.title}</div>
                            <div className="mt-2 text-[12px] text-slate-400">
                              {item.sourceType === "url" ? item.sourceUrl || "网页链接导入" : "手动正文导入"} · {formatDate(item.createdAt)}
                            </div>
                          </div>
                          <div className="rounded-full border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,241,250,0.96))] px-3 py-1 text-[12px] font-medium text-slate-500 shadow-[0_6px_14px_rgba(219,214,232,0.16)]">{item.importStatus}</div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-[14px] leading-7 text-slate-600">{item.excerpt}…</p>
                          <button
                            type="button"
                            onClick={() => {
                              void confirmDeleteItem(item.id);
                            }}
                            disabled={deletingItemId === item.id}
                            className={ghost}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingItemId === item.id ? "删除中" : "删除"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,241,250,0.97))] px-4 py-4 text-[14px] leading-7 text-slate-500 shadow-[0_10px_20px_rgba(219,214,232,0.16)]">当前内容集还没有条目。</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-[15px] leading-7 text-slate-500">先从左侧选择内容集，再查看详情。</div>
          )}
        </section>
      </div>
    </>
  );
}
