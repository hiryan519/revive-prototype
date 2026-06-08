import Link from "next/link";
import { buildBookmarkletHref, resolveAppUrl } from "@/lib/bookmarklet";
import { cx, panel, panelMuted, primary, secondary, shell } from "@/components/revive/helpers";

export default function HelpPage() {
  const appUrl = resolveAppUrl();
  const bookmarkletHref = buildBookmarkletHref(appUrl);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1120px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className={cx(shell, "px-6 py-8 sm:px-8 sm:py-10")}>
        <div className="max-w-[760px]">
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Revive Help</div>
          <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 sm:text-[42px]">浏览器一键加入最近收藏</h1>
          <p className="mt-4 text-[16px] leading-8 text-slate-600">
            将下方按钮拖拽到浏览器书签栏，之后在任意网页点击它，即可一键将当前页面加入你的最近收藏。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={bookmarkletHref} className={primary}>
              拖到书签栏：加入 Revive
            </a>
            <Link href="/import" className={secondary}>
              返回导入页
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_320px]">
          <section id="bookmarklet" className={cx(panel, "px-5 py-5")}>
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-slate-900">安装步骤</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-7 text-slate-600">
              <p>1. 确保浏览器已经显示书签栏。</p>
              <p>2. 用鼠标把“加入 Revive”按钮拖到书签栏。</p>
              <p>3. 打开任意想收藏的网页，点击这个书签。</p>
              <p>4. 页面右下角会显示导入状态；如果当前网站限制跨域请求，书签会自动打开 Revive 中转页继续导入。</p>
            </div>
            <div className="mt-6 rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,241,250,0.97))] px-4 py-4 text-[13px] leading-6 text-slate-500 shadow-[0_10px_20px_rgba(219,214,232,0.16)]">
              当前书签会调用：<span className="font-medium text-slate-700">{appUrl}/api/bookmarklet-import</span>
            </div>
          </section>

          <aside className={cx(panelMuted, "px-5 py-5")}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Notes</div>
            <div className="mt-4 space-y-3 text-[14px] leading-6 text-slate-600">
              <div className="rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                书签导入不会改变现有导入链路，仍然会走正文解析、内容入库、切块和 embedding。
              </div>
              <div className="rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                所有书签导入内容都会自动归入“最近收藏”，方便你后续再整理到更明确的内容集。
              </div>
              <div className="rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                某些网站会限制页面脚本直接请求本地或其他域名，遇到这种情况时，书签会自动打开 Revive 中转页来完成导入。
              </div>
              <div className="rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                如果部署域名变化，只需要更新 <code>NEXT_PUBLIC_APP_URL</code>，页面里的书签代码会自动更新。
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
