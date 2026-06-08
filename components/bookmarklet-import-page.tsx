"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cx, panel, panelMuted, primary, secondary, shell } from "@/components/revive/helpers";

type ImportState = "loading" | "success" | "error";

export function BookmarkletImportPage({ targetUrl }: { targetUrl: string }) {
  const [state, setState] = useState<ImportState>("loading");
  const [message, setMessage] = useState("正在把当前页面加入最近收藏...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!targetUrl) {
        if (!cancelled) {
          setState("error");
          setMessage("缺少要导入的网页链接。");
        }
        return;
      }

      try {
        const response = await fetch("/api/bookmarklet-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        const payload = (await response.json()) as { success?: boolean; error?: string };

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "导入失败，请稍后重试");
        }

        if (!cancelled) {
          setState("success");
          setMessage("已成功加入最近收藏。");
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "导入失败，请稍后重试");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [targetUrl]);

  const hostLabel = useMemo(() => {
    try {
      return targetUrl ? new URL(targetUrl).hostname : "";
    } catch {
      return "";
    }
  }, [targetUrl]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[860px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <section className={cx(shell, "px-6 py-8 sm:px-8 sm:py-10")}>
        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Revive Bookmarklet</div>
        <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.05em] text-slate-900 sm:text-[40px]">书签导入中转页</h1>
        <p className="mt-4 text-[16px] leading-8 text-slate-600">
          当前网站如果限制跨域请求，书签会自动跳转到这个页面继续导入，所以即使原网页不放行，也能把内容收进 Revive。
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className={cx(panel, "px-5 py-5")}>
            <div className="rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,241,250,0.98))] px-5 py-5 shadow-[0_12px_24px_rgba(219,214,232,0.18)]">
              <div className="text-[12px] text-slate-400">当前状态</div>
              <div
                className={cx(
                  "mt-3 text-[22px] font-semibold tracking-[-0.03em]",
                  state === "success" && "text-emerald-600",
                  state === "error" && "text-rose-600",
                  state === "loading" && "text-slate-900",
                )}
              >
                {state === "loading" ? "正在导入" : state === "success" ? "导入成功" : "导入失败"}
              </div>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">{message}</p>
            </div>

            <div className="mt-5 rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,241,250,0.97))] px-4 py-4 text-[13px] leading-6 text-slate-500 shadow-[0_10px_20px_rgba(219,214,232,0.16)]">
              <div>目标网页：{hostLabel || "未识别"}</div>
              <div className="mt-2 break-all text-slate-600">{targetUrl || "未提供链接"}</div>
            </div>
          </section>

          <aside className={cx(panelMuted, "px-5 py-5")}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Next</div>
            <div className="mt-4 space-y-3">
              <Link href="/collections" className={primary}>
                去看最近收藏
              </Link>
              <Link href="/help#bookmarklet" className={secondary}>
                返回安装说明
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
