import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { storeImportedItem } from "@/lib/server";
import { importFromUrl } from "@/lib/web-import";

export const runtime = "nodejs";

const bodySchema = z.object({
  collectionName: z.string().trim().min(1, "请填写内容集名称").max(80),
  url: z.string().trim().url("请输入有效的网页链接"),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const imported = await importFromUrl(body.url);
    const stored = await storeImportedItem({
      collectionName: body.collectionName,
      title: imported.title,
      contentText: imported.contentText,
      contentMarkdown: imported.contentMarkdown,
      sourceType: "url",
      sourceUrl: body.url,
    });

    return NextResponse.json({
      success: true,
      ...stored,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "导入网页失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
