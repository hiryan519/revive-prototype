import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getRouteError } from "@/lib/route-errors";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  taskRunId: z.string().uuid("任务 ID 不合法"),
  rating: z.enum(["usable", "unusable"]),
});

export async function POST(request: Request) {
  try {
    const body = feedbackSchema.parse(await request.json());
    console.info("[TaskFeedback]", {
      taskRunId: body.taskRunId,
      rating: body.rating,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const routeError = getRouteError(error, "记录反馈失败");
    return NextResponse.json({ error: routeError.message }, { status: routeError.status });
  }
}
