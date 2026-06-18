import { createChunks } from "@/lib/chunking";
import { embedText, embedTexts, runTaskWithModel } from "@/lib/ai";
import { getCurrentUserId } from "@/lib/current-user";
import { getDb } from "@/lib/db";
import type {
  CollectionDetail,
  CollectionSummary,
  MemoryDimension,
  MemoryPolarity,
  MemoryRecord,
  MemoryScope,
  MemorySource,
  MemoryTaskType,
  TaskResult,
} from "@/lib/types";

function vectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function mapMemoryRow(row: {
  id: string;
  userId: string;
  scope: MemoryScope;
  taskType: MemoryTaskType | null;
  dimension: MemoryDimension;
  value: string;
  polarity: MemoryPolarity;
  source: MemorySource;
  sourceDetail: string | null;
  confidence: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}): MemoryRecord {
  return row;
}

export async function upsertCollection(collectionName: string, description?: string | null) {
  const db = getDb();
  const [existing] = await db<{ id: string; name: string }[]>`
    select id, name
    from collections
    where lower(name) = lower(${collectionName})
    limit 1
  `;

  if (existing) {
    const [updated] = await db<{ id: string; name: string }[]>`
      update collections
      set description = coalesce(${description ?? null}, description),
          updated_at = timezone('utc', now())
      where id = ${existing.id}
      returning id, name
    `;
    return updated;
  }

  const [created] = await db<{ id: string; name: string }[]>`
    insert into collections (name, description)
    values (${collectionName}, ${description ?? null})
    returning id, name
  `;

  return created;
}

export async function storeImportedItem(params: {
  collectionName: string;
  collectionDescription?: string | null;
  title: string;
  contentText: string;
  contentMarkdown?: string | null;
  sourceType: string;
  sourceUrl?: string | null;
}) {
  const db = getDb();
  const collection = await upsertCollection(params.collectionName, params.collectionDescription);
  const chunks = createChunks(params.contentText);
  const embeddings = chunks.length ? await embedTexts(chunks) : [];

  const deduped = await db.begin(async (tx) => {
    const query = tx as unknown as typeof db;

    async function reuseExistingItemIfReady(itemId: string) {
      const [chunkRow] = await query<{ count: number }[]>`
        select count(*)::int as count
        from chunks
        where item_id = ${itemId}
      `;

      if ((chunkRow?.count ?? 0) > 0) {
        return {
          itemId,
          deduped: true,
        };
      }

      await query`delete from items where id = ${itemId}`;
      return null;
    }

    const duplicateByUrl =
      params.sourceType === "url" && params.sourceUrl
        ? await query<{ id: string }[]>`
            select id
            from items
            where collection_id = ${collection.id}
              and source_type = ${params.sourceType}
              and source_url = ${params.sourceUrl}
            limit 1
          `
        : [];

    if (duplicateByUrl[0]) {
      const reusable = await reuseExistingItemIfReady(duplicateByUrl[0].id);
      if (reusable) {
        return reusable;
      }
    }

    const duplicateByContent = await query<{ id: string }[]>`
      select id
      from items
      where collection_id = ${collection.id}
        and source_type = ${params.sourceType}
        and title = ${params.title}
        and content_text = ${params.contentText}
      limit 1
    `;

    if (duplicateByContent[0]) {
      const reusable = await reuseExistingItemIfReady(duplicateByContent[0].id);
      if (reusable) {
        return reusable;
      }
    }

    const [item] = await query<{ id: string }[]>`
      insert into items (
        collection_id,
        source_url,
        source_type,
        title,
        content_text,
        content_markdown,
        import_status
      )
      values (
        ${collection.id},
        ${params.sourceUrl ?? null},
        ${params.sourceType},
        ${params.title},
        ${params.contentText},
        ${params.contentMarkdown ?? null},
        'completed'
      )
      returning id
    `;

    if (chunks.length) {
      const valuesSql = chunks
        .map((text, index) => {
          const embedding = embeddings[index] ?? [];
          return `(${sqlString(item.id)}, ${sqlString(collection.id)}, ${index}, ${sqlString(text)}, '${vectorLiteral(embedding)}'::vector)`;
        })
        .join(", ");

      await query.unsafe(`
        insert into chunks (
          item_id,
          collection_id,
          chunk_index,
          text,
          embedding
        )
        values ${valuesSql}
      `);
    }

    return {
      itemId: item.id,
      deduped: false,
    };
  });

  return {
    collectionId: collection.id,
    itemId: deduped.itemId,
    title: params.title,
    contentLength: params.contentText.length,
    chunkCount: chunks.length,
    deduped: deduped.deduped,
  };
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const db = getDb();
  const rows = await db<CollectionSummary[]>`
    select
      c.id,
      c.name,
      c.description,
      coalesce(count(i.id), 0)::int as "itemCount",
      c.updated_at as "updatedAt"
    from collections c
    left join items i on i.collection_id = c.id
    group by c.id
    order by c.updated_at desc
  `;

  return rows;
}

export async function getCollectionDetail(collectionId: string): Promise<CollectionDetail | null> {
  const db = getDb();
  const [collection] = await db<CollectionSummary[]>`
    select
      c.id,
      c.name,
      c.description,
      coalesce(count(i.id), 0)::int as "itemCount",
      c.updated_at as "updatedAt"
    from collections c
    left join items i on i.collection_id = c.id
    where c.id = ${collectionId}
    group by c.id
    limit 1
  `;

  if (!collection) {
    return null;
  }

  const items = await db<
    Array<{
      id: string;
      title: string;
      sourceUrl: string | null;
      sourceType: string;
      importStatus: string;
      createdAt: string;
      excerpt: string;
    }>
  >`
    select
      id,
      title,
      source_url as "sourceUrl",
      source_type as "sourceType",
      import_status as "importStatus",
      created_at as "createdAt",
      left(content_text, 180) as excerpt
    from items
    where collection_id = ${collectionId}
    order by created_at desc
  `;

  return {
    ...collection,
    items,
  };
}

export async function renameCollection(collectionId: string, name: string) {
  const db = getDb();
  const [updated] = await db<CollectionSummary[]>`
    update collections
    set name = ${name},
        updated_at = timezone('utc', now())
    where id = ${collectionId}
    returning
      id,
      name,
      description,
      (
        select coalesce(count(i.id), 0)::int
        from items i
        where i.collection_id = collections.id
      ) as "itemCount",
      updated_at as "updatedAt"
  `;

  return updated ?? null;
}

export async function deleteCollection(collectionId: string) {
  const db = getDb();

  await db.begin(async (tx) => {
    const query = tx as unknown as typeof db;
    await query`delete from chunks where collection_id = ${collectionId}`;
    await query`delete from items where collection_id = ${collectionId}`;
    const deleted = await query<{ id: string }[]>`
      delete from collections
      where id = ${collectionId}
      returning id
    `;

    if (!deleted[0]) {
      throw new Error("内容集不存在");
    }
  });
}

export async function deleteItem(itemId: string) {
  const db = getDb();

  const deleted = await db.begin(async (tx) => {
    const query = tx as unknown as typeof db;
    await query`delete from chunks where item_id = ${itemId}`;
    const rows = await query<{ id: string }[]>`
      delete from items
      where id = ${itemId}
      returning id
    `;

    return rows[0] ?? null;
  });

  if (!deleted) {
    throw new Error("内容不存在");
  }
}

export async function getMemoriesByUser(userId: string): Promise<MemoryRecord[]> {
  const db = getDb();
  const rows = await db<MemoryRecord[]>`
    select
      id,
      user_id as "userId",
      scope,
      task_type as "taskType",
      dimension,
      value,
      polarity,
      source,
      source_detail as "sourceDetail",
      confidence,
      enabled,
      created_at as "createdAt",
      updated_at as "updatedAt"
    from memories
    where user_id = ${userId}
    order by
      case scope when 'global' then 0 else 1 end,
      task_type asc nulls first,
      created_at desc
  `;

  return rows.map(mapMemoryRow);
}

export async function createMemory(data: {
  scope: MemoryScope;
  taskType?: MemoryTaskType | null;
  dimension: MemoryDimension;
  value: string;
  polarity?: MemoryPolarity;
  source?: MemorySource;
  sourceDetail?: string | null;
  confidence?: number;
  enabled?: boolean;
}) {
  const db = getDb();
  const userId = getCurrentUserId();
  const id = crypto.randomUUID();

  const [created] = await db<MemoryRecord[]>`
    insert into memories (
      id,
      user_id,
      scope,
      task_type,
      dimension,
      value,
      polarity,
      source,
      source_detail,
      confidence,
      enabled
    )
    values (
      ${id},
      ${userId},
      ${data.scope},
      ${data.scope === "task_type" ? data.taskType ?? null : null},
      ${data.dimension},
      ${data.value},
      ${data.polarity ?? "positive"},
      ${data.source ?? "explicit_setting"},
      ${data.sourceDetail ?? null},
      ${data.confidence ?? 1},
      ${data.enabled ?? true}
    )
    returning
      id,
      user_id as "userId",
      scope,
      task_type as "taskType",
      dimension,
      value,
      polarity,
      source,
      source_detail as "sourceDetail",
      confidence,
      enabled,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  return created ? mapMemoryRow(created) : null;
}

export async function updateMemory(
  id: string,
  data: {
    scope?: MemoryScope;
    taskType?: MemoryTaskType | null;
    dimension?: MemoryDimension;
    value?: string;
    polarity?: MemoryPolarity;
    sourceDetail?: string | null;
    enabled?: boolean;
  },
) {
  const db = getDb();
  const userId = getCurrentUserId();
  const [existing] = await db<MemoryRecord[]>`
    select
      id,
      user_id as "userId",
      scope,
      task_type as "taskType",
      dimension,
      value,
      polarity,
      source,
      source_detail as "sourceDetail",
      confidence,
      enabled,
      created_at as "createdAt",
      updated_at as "updatedAt"
    from memories
    where id = ${id}
      and user_id = ${userId}
    limit 1
  `;

  if (!existing) {
    return null;
  }

  const nextScope = data.scope ?? existing.scope;
  const nextTaskType =
    nextScope === "global"
      ? null
      : data.taskType !== undefined
        ? data.taskType
        : existing.taskType;

  if (nextScope === "task_type" && !nextTaskType) {
    throw new Error("任务类型级偏好需要指定任务类型");
  }

  const [updated] = await db<MemoryRecord[]>`
    update memories
    set
      scope = ${nextScope},
      task_type = ${nextTaskType},
      dimension = ${data.dimension ?? existing.dimension},
      value = ${data.value ?? existing.value},
      polarity = ${data.polarity ?? existing.polarity},
      source_detail = ${data.sourceDetail !== undefined ? data.sourceDetail : existing.sourceDetail},
      enabled = ${data.enabled ?? existing.enabled}
    where id = ${id}
      and user_id = ${userId}
    returning
      id,
      user_id as "userId",
      scope,
      task_type as "taskType",
      dimension,
      value,
      polarity,
      source,
      source_detail as "sourceDetail",
      confidence,
      enabled,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  return updated ? mapMemoryRow(updated) : null;
}

export async function deleteMemory(id: string) {
  const db = getDb();
  const userId = getCurrentUserId();
  const [deleted] = await db<{ id: string }[]>`
    delete from memories
    where id = ${id}
      and user_id = ${userId}
    returning id
  `;

  return deleted?.id ?? null;
}

export async function toggleMemory(id: string, enabled: boolean) {
  return updateMemory(id, { enabled });
}

export async function runTask(params: { collectionId?: string; query: string }): Promise<TaskResult> {
  const db = getDb();
  const queryEmbedding = await embedText(params.query);
  const rows = await db<
    Array<{
      chunkId: string;
      collectionName: string;
      title: string;
      text: string;
      sourceUrl: string | null;
    }>
  >`
    select
      c.id as "chunkId",
      collections.name as "collectionName",
      i.title,
      c.text,
      i.source_url as "sourceUrl"
    from chunks c
    inner join items i on i.id = c.item_id
    inner join collections on collections.id = c.collection_id
    order by c.embedding <=> ${vectorLiteral(queryEmbedding)}::vector
    limit 5
  `;

  if (!rows.length) {
    throw new Error("当前还没有可检索的收藏内容，请先导入内容");
  }

  const result = await runTaskWithModel(params.query, rows);

  await db`
    insert into task_runs (collection_id, user_query, result_json, citations_json)
    values (
      ${params.collectionId ?? null},
      ${params.query},
      ${JSON.stringify(result)}::jsonb,
      ${JSON.stringify(result.citations)}::jsonb
    )
  `;

  return result;
}
