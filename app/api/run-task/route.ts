import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { runTask } from "@/lib/server";
import { getRouteError } from "@/lib/route-errors";

export const runtime = "nodejs";

const bodySchema = z.object({
  query: z.string().trim().min(3, "请先输入任务需求").max(1200),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const taskRun = await runTask(body);

    return NextResponse.json({
      success: true,
      ...taskRun,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const routeError = getRouteError(error, "任务执行失败");
    return NextResponse.json({ success: false, error: routeError.message }, { status: routeError.status });
  }
}
