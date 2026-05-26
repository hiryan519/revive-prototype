import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { deleteCollection, getCollectionDetail, renameCollection } from "@/lib/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().trim().min(1, "请填写内容集名称").max(80),
});

export async function GET(_: Request, context: { params: Promise<{ collectionId: string }> }) {
  try {
    const { collectionId } = await context.params;
    const collection = await getCollectionDetail(collectionId);

    if (!collection) {
      return NextResponse.json({ error: "内容集不存在" }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取内容集详情失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ collectionId: string }> }) {
  try {
    const { collectionId } = await context.params;
    const body = bodySchema.parse(await request.json());
    const collection = await renameCollection(collectionId, body.name);

    if (!collection) {
      return NextResponse.json({ error: "内容集不存在" }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "请求参数错误" }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "更新内容集名称失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ collectionId: string }> }) {
  try {
    const { collectionId } = await context.params;
    await deleteCollection(collectionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除内容集失败";
    const status = message === "内容集不存在" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
