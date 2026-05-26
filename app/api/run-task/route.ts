import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { runTask } from "@/lib/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  collectionId: z.string().uuid("内容集 ID 不合法").optional(),
  query: z.string().trim().min(3, "请先输入任务需求").max(1200),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const result = await runTask(body);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "任务执行失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
