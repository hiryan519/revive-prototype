"use client";

import { Eye, EyeOff, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  cx,
  field,
  formatDate,
  ghost,
  panel,
  panelMuted,
  primary,
  readJson,
  secondary,
  shell,
  textarea,
} from "@/components/revive/helpers";
import type {
  MemoryDimension,
  MemoryPolarity,
  MemoryRecord,
  MemoryScope,
  MemorySource,
  MemoryTaskType,
} from "@/lib/types";

type MemoryFormState = {
  scope: MemoryScope;
  taskType: MemoryTaskType | "";
  dimension: MemoryDimension;
  value: string;
  polarity: MemoryPolarity;
  sourceDetail: string;
};

const emptyForm: MemoryFormState = {
  scope: "global",
  taskType: "",
  dimension: "output_structure",
  value: "",
  polarity: "positive",
  sourceDetail: "",
};

const dimensionOptions: Array<{ value: MemoryDimension; label: string }> = [
  { value: "output_structure", label: "输出结构偏好" },
  { value: "citation_style", label: "引用使用偏好" },
  { value: "expression_style", label: "表达风格偏好" },
  { value: "task_structure", label: "任务结构偏好" },
];

const taskTypeOptions: Array<{ value: MemoryTaskType; label: string }> = [
  { value: "plan", label: "方案" },
  { value: "review", label: "复盘" },
  { value: "report", label: "汇报提纲" },
];

const sourceLabels: Record<MemorySource, string> = {
  explicit_setting: "手动设置",
  user_feedback: "结果反馈",
  behavior_inferred: "行为推断",
};

const polarityLabels: Record<MemoryPolarity, string> = {
  positive: "正向偏好",
  negative: "负向偏好",
};

const dimensionLabels: Record<MemoryDimension, string> = {
  output_structure: "输出结构偏好",
  citation_style: "引用使用偏好",
  expression_style: "表达风格偏好",
  task_structure: "任务结构偏好",
};

function toFormState(memory: MemoryRecord): MemoryFormState {
  return {
    scope: memory.scope,
    taskType: memory.taskType ?? "",
    dimension: memory.dimension,
    value: memory.value,
    polarity: memory.polarity,
    sourceDetail: memory.sourceDetail ?? "",
  };
}

function MemoryCard(props: {
  memory: MemoryRecord;
  sourceOpen: boolean;
  onEdit: (memory: MemoryRecord) => void;
  onDelete: (memory: MemoryRecord) => void;
  onToggle: (memory: MemoryRecord) => void;
  onToggleSource: (memoryId: string) => void;
}) {
  const { memory, sourceOpen, onEdit, onDelete, onToggle, onToggleSource } = props;

  return (
    <article
      className={cx(
        panel,
        "px-5 py-5 transition",
        !memory.enabled && "border-slate-200/70 opacity-65 saturate-50",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[12px] text-slate-500">
              {dimensionLabels[memory.dimension]}
            </span>
            <span
              className={cx(
                "rounded-full border px-3 py-1 text-[12px]",
                memory.polarity === "positive"
                  ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
                  : "border-amber-200/80 bg-amber-50 text-amber-700",
              )}
            >
              {polarityLabels[memory.polarity]}
            </span>
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[12px] text-slate-500">
              {memory.enabled ? "启用中" : "已停用"}
            </span>
          </div>

          <div className="text-[16px] leading-7 text-slate-900">{memory.value}</div>

          <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
            <span>来源：{sourceLabels[memory.source]}</span>
            <span>更新时间：{formatDate(memory.updatedAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onEdit(memory)} className={ghost}>
            <Pencil className="mr-2 h-4 w-4" />
            编辑
          </button>
          <button type="button" onClick={() => onToggle(memory)} className={ghost}>
            {memory.enabled ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {memory.enabled ? "停用" : "启用"}
          </button>
          <button type="button" onClick={() => onDelete(memory)} className={ghost}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </button>
          <button type="button" onClick={() => onToggleSource(memory.id)} className={ghost}>
            {sourceOpen ? "收起来源" : "查看来源"}
          </button>
        </div>
      </div>

      {sourceOpen ? (
        <div className="mt-4 rounded-[18px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,241,250,0.96))] px-4 py-4 text-[13px] leading-6 text-slate-600 shadow-[0_10px_18px_rgba(224,219,235,0.16)]">
          {memory.sourceDetail?.trim() || "这条记忆暂时没有额外来源说明。"}
        </div>
      ) : null}
    </article>
  );
}

export function PreferencesPage() {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sourceOpenId, setSourceOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<MemoryFormState>(emptyForm);

  const grouped = useMemo(() => {
    const globalMemories = memories.filter((memory) => memory.scope === "global");
    const taskTypeGroups = {
      plan: memories.filter((memory) => memory.scope === "task_type" && memory.taskType === "plan"),
      review: memories.filter((memory) => memory.scope === "task_type" && memory.taskType === "review"),
      report: memories.filter((memory) => memory.scope === "task_type" && memory.taskType === "report"),
    };

    return { globalMemories, taskTypeGroups };
  }, [memories]);

  const hasMemories = memories.length > 0;

  async function loadMemories() {
    setLoading(true);
    setPageError(null);

    try {
      const payload = await readJson<{ memories: MemoryRecord[] }>("/api/memories");
      setMemories(payload.memories);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "读取偏好记忆失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMemories();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setPageError(null);

    const body = {
      scope: form.scope,
      taskType: form.scope === "task_type" ? form.taskType : null,
      dimension: form.dimension,
      value: form.value.trim(),
      polarity: form.polarity,
      sourceDetail: form.sourceDetail.trim() || null,
    };

    try {
      if (editingId) {
        const payload = await readJson<{ memory: MemoryRecord }>(`/api/memories/${editingId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });

        setMemories((current) => current.map((memory) => (memory.id === editingId ? payload.memory : memory)));
      } else {
        const payload = await readJson<{ memory: MemoryRecord }>("/api/memories", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });

        setMemories((current) => [payload.memory, ...current]);
      }

      resetForm();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "保存偏好记忆失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(memory: MemoryRecord) {
    try {
      const payload = await readJson<{ memory: MemoryRecord }>(`/api/memories/${memory.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !memory.enabled }),
      });

      setMemories((current) => current.map((item) => (item.id === memory.id ? payload.memory : item)));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "更新偏好状态失败");
    }
  }

  async function handleDelete(memory: MemoryRecord) {
    const confirmed = window.confirm(`确定要删除这条偏好记忆吗？\n\n${memory.value}`);
    if (!confirmed) return;

    try {
      await readJson<{ success: true }>(`/api/memories/${memory.id}`, {
        method: "DELETE",
      });

      setMemories((current) => current.filter((item) => item.id !== memory.id));

      if (editingId === memory.id) {
        resetForm();
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "删除偏好记忆失败");
    }
  }

  function handleEdit(memory: MemoryRecord) {
    setEditingId(memory.id);
    setForm(toFormState(memory));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className={cx(shell, "px-6 py-8 sm:px-8 sm:py-10")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Revive Preferences</div>
            <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 sm:text-[42px]">我的偏好</h1>
            <p className="mt-4 text-[16px] leading-8 text-slate-600">
              这里管理 Revive 记住的任务偏好。它们会在后续生成结果时作为软约束参与提示词注入，但不会覆盖你当前任务的明确指令和收藏内容本身。
            </p>
          </div>
          <button type="button" onClick={resetForm} className={secondary}>
            <Plus className="mr-2 h-4 w-4" />
            新增一条偏好
          </button>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className={cx(panel, "px-5 py-5")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Editor</div>
                <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-slate-900">
                  {editingId ? "编辑偏好记忆" : "新增偏好记忆"}
                </h2>
              </div>
              {editingId ? (
                <button type="button" onClick={resetForm} className={ghost}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  取消编辑
                </button>
              ) : null}
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-slate-700">作用域</label>
                <select
                  value={form.scope}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      scope: event.target.value as MemoryScope,
                      taskType: event.target.value === "global" ? "" : current.taskType,
                    }))
                  }
                  className={field}
                >
                  <option value="global">全局偏好</option>
                  <option value="task_type">任务类型级偏好</option>
                </select>
              </div>

              {form.scope === "task_type" ? (
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-slate-700">任务类型</label>
                  <select
                    value={form.taskType}
                    onChange={(event) => setForm((current) => ({ ...current, taskType: event.target.value as MemoryTaskType }))}
                    className={field}
                  >
                    <option value="">请选择任务类型</option>
                    {taskTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-[13px] font-medium text-slate-700">偏好维度</label>
                <select
                  value={form.dimension}
                  onChange={(event) => setForm((current) => ({ ...current, dimension: event.target.value as MemoryDimension }))}
                  className={field}
                >
                  {dimensionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-slate-700">偏好方向</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, polarity: "positive" }))}
                    className={cx(
                      ghost,
                      "justify-center",
                      form.polarity === "positive" && "border-emerald-200/80 bg-emerald-50 text-emerald-700",
                    )}
                  >
                    正向
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, polarity: "negative" }))}
                    className={cx(
                      ghost,
                      "justify-center",
                      form.polarity === "negative" && "border-amber-200/80 bg-amber-50 text-amber-700",
                    )}
                  >
                    负向
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-slate-700">偏好内容</label>
                <textarea
                  value={form.value}
                  onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                  placeholder="例如：方案类任务优先按目标 → 策略 → 执行步骤输出"
                  className={cx(textarea, "min-h-[160px]")}
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-slate-700">来源说明</label>
                <input
                  value={form.sourceDetail}
                  onChange={(event) => setForm((current) => ({ ...current, sourceDetail: event.target.value }))}
                  placeholder="例如：首次手动设置，后续可在结果页继续补充"
                  className={field}
                />
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !form.value.trim() ||
                  (form.scope === "task_type" && !form.taskType)
                }
                className={cx(primary, "w-full")}
              >
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "正在保存" : editingId ? "保存修改" : "创建偏好"}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            {pageError ? (
              <div className="rounded-[18px] border border-rose-200/70 bg-rose-50/92 px-4 py-3 text-[13px] leading-6 text-rose-900 shadow-[0_10px_20px_rgba(245,205,214,0.18)]">
                {pageError}
              </div>
            ) : null}

            {loading ? (
              <section className={cx(panelMuted, "px-5 py-6 text-[15px] text-slate-500")}>正在读取偏好记忆...</section>
            ) : !hasMemories ? (
              <section className={cx(panelMuted, "px-6 py-8")}>
                <h3 className="text-[22px] font-semibold tracking-[-0.04em] text-slate-900">还没有任何偏好记忆</h3>
                <p className="mt-3 max-w-[58ch] text-[15px] leading-7 text-slate-600">
                  你可以先添加几条基础偏好，例如更偏好的输出结构、引用风格或不希望出现的表达方式。后续结果页的反馈写入也会补充到这里。
                </p>
              </section>
            ) : (
              <>
                <section className={cx(panelMuted, "px-5 py-5")}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Global</div>
                      <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-slate-900">全局偏好</h3>
                    </div>
                    <div className="text-[12px] text-slate-400">{grouped.globalMemories.length} 条</div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {grouped.globalMemories.length ? (
                      grouped.globalMemories.map((memory) => (
                        <MemoryCard
                          key={memory.id}
                          memory={memory}
                          sourceOpen={sourceOpenId === memory.id}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggle={handleToggle}
                          onToggleSource={(memoryId) => setSourceOpenId((current) => (current === memoryId ? null : memoryId))}
                        />
                      ))
                    ) : (
                      <div className="rounded-[18px] border border-slate-200/80 bg-white/70 px-4 py-4 text-[14px] leading-6 text-slate-500">
                        还没有全局偏好，适合先放跨任务都生效的引用和表达偏好。
                      </div>
                    )}
                  </div>
                </section>

                {taskTypeOptions.map((option) => {
                  const memoriesForType = grouped.taskTypeGroups[option.value];

                  return (
                    <section key={option.value} className={cx(panelMuted, "px-5 py-5")}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Task Type</div>
                          <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-slate-900">{option.label}</h3>
                        </div>
                        <div className="text-[12px] text-slate-400">{memoriesForType.length} 条</div>
                      </div>
                      <div className="mt-4 space-y-4">
                        {memoriesForType.length ? (
                          memoriesForType.map((memory) => (
                            <MemoryCard
                              key={memory.id}
                              memory={memory}
                              sourceOpen={sourceOpenId === memory.id}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onToggle={handleToggle}
                              onToggleSource={(memoryId) => setSourceOpenId((current) => (current === memoryId ? null : memoryId))}
                            />
                          ))
                        ) : (
                          <div className="rounded-[18px] border border-slate-200/80 bg-white/70 px-4 py-4 text-[14px] leading-6 text-slate-500">
                            还没有针对“{option.label}”的任务类型级偏好。
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
