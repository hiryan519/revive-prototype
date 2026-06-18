import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { deleteMemory, toggleMemory, updateMemory } from "@/lib/server";
import { getRouteError } from "@/lib/route-errors";

export const runtime = "nodejs";

const scopeSchema = z.enum(["global", "task_type"]);
const taskTypeSchema = z.enum(["plan", "review", "report"]);
const dimensionSchema = z.enum(["output_structure", "citation_style", "expression_style", "task_structure"]);
const polaritySchema = z.enum(["positive", "negative"]);

const paramsSchema = z.object({
  id: z.string().uuid("记忆 ID 不合法"),
});

const patchSchema = z
  .object({
    scope: scopeSchema.optional(),
    taskType: taskTypeSchema.optional().nullable(),
    dimension: dimensionSchema.optional(),
    value: z.string().trim().min(1, "请填写偏好内容").max(500, "偏好内容请控制在 500 字以内").optional(),
    polarity: polaritySchema.optional(),
    sourceDetail: z.string().trim().max(200, "来源说明请控制在 200 字以内").optional().nullable(),
    enabled: z.boolean().optional(),
  })
  .superRefine((body, ctx) => {
    if (body.scope === "global" && body.taskType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taskType"],
        message: "全局偏好不能指定任务类型",
      });
    }

    if (body.scope === "task_type" && !body.taskType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taskType"],
        message: "任务类型级偏好需要指定任务类型",
      });
    }
  });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = paramsSchema.parse(await context.params);
    const body = patchSchema.parse(await request.json());

    const shouldOnlyToggle =
      Object.keys(body).length === 1 &&
      typeof body.enabled === "boolean";

    const memory = shouldOnlyToggle
      ? await toggleMemory(params.id, body.enabled as boolean)
      : await updateMemory(params.id, body);

    if (!memory) {
      return NextResponse.json({ error: "偏好记忆不存在" }, { status: 404 });
    }

    return NextResponse.json({ memory });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const routeError = getRouteError(error, "更新偏好记忆失败");
    return NextResponse.json({ error: routeError.message }, { status: routeError.status });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = paramsSchema.parse(await context.params);
    const deletedId = await deleteMemory(params.id);

    if (!deletedId) {
      return NextResponse.json({ error: "偏好记忆不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const routeError = getRouteError(error, "删除偏好记忆失败");
    return NextResponse.json({ error: routeError.message }, { status: routeError.status });
  }
}
