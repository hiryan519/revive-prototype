import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { importUrlToCollection } from "@/lib/import-url-service";
import { getRouteError } from "@/lib/route-errors";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Private-Network": "true",
  Vary: "Origin, Access-Control-Request-Private-Network",
};

const bodySchema = z.object({
  url: z.string().trim().url("请输入有效的网页链接"),
});

function json(body: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    await importUrlToCollection({
      url: body.url,
      useRecentCollection: true,
    });

    return json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return json({ success: false, error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const routeError = getRouteError(error, "加入最近收藏失败");
    return json({ success: false, error: routeError.message }, { status: routeError.status });
  }
}
