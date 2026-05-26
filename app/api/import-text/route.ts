import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { storeImportedItem } from "@/lib/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  collectionName: z.string().trim().min(1, "请填写内容集名称").max(80),
  title: z.string().trim().min(1, "请填写标题").max(200),
  content: z.string().trim().min(80, "正文至少需要 80 个字符"),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const stored = await storeImportedItem({
      collectionName: body.collectionName,
      title: body.title,
      contentText: body.content,
      sourceType: "manual_text",
    });

    return NextResponse.json({
      success: true,
      ...stored,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "导入文本失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
