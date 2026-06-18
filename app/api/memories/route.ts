import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getCurrentUserId } from "@/lib/current-user";
import { createMemory, getMemoriesByUser } from "@/lib/server";
import { getRouteError } from "@/lib/route-errors";

export const runtime = "nodejs";

const scopeSchema = z.enum(["global", "task_type"]);
const taskTypeSchema = z.enum(["plan", "review", "report"]);
const dimensionSchema = z.enum(["output_structure", "citation_style", "expression_style", "task_structure"]);
const polaritySchema = z.enum(["positive", "negative"]);
const sourceSchema = z.enum(["explicit_setting", "user_feedback", "behavior_inferred"]);

const createMemorySchema = z
  .object({
    scope: scopeSchema,
    taskType: taskTypeSchema.optional().nullable(),
    dimension: dimensionSchema,
    value: z.string().trim().min(1, "请填写偏好内容").max(500, "偏好内容请控制在 500 字以内"),
    polarity: polaritySchema.optional(),
    source: sourceSchema.optional(),
    sourceDetail: z.string().trim().max(200, "来源说明请控制在 200 字以内").optional().nullable(),
    confidence: z.number().min(0).max(1).optional(),
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

export async function GET() {
  try {
    const memories = await getMemoriesByUser(getCurrentUserId());
    return NextResponse.json({ memories });
  } catch (error) {
    const routeError = getRouteError(error, "读取偏好记忆失败");
    return NextResponse.json({ error: routeError.message }, { status: routeError.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = createMemorySchema.parse(await request.json());
    const memory = await createMemory(body);
    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const routeError = getRouteError(error, "创建偏好记忆失败");
    return NextResponse.json({ error: routeError.message }, { status: routeError.status });
  }
}
