export type CollectionRecord = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemRecord = {
  id: string;
  collection_id: string;
  source_url: string | null;
  source_type: string;
  title: string;
  content_text: string;
  content_markdown: string | null;
  import_status: string;
  created_at: string;
  updated_at: string;
};

export type ChunkRecord = {
  id: string;
  item_id: string;
  collection_id: string;
  chunk_index: number;
  text: string;
};

export type MemoryScope = "global" | "task_type";
export type MemoryTaskType = "plan" | "review" | "report";
export type MemoryDimension = "output_structure" | "citation_style" | "expression_style" | "task_structure";
export type MemoryPolarity = "positive" | "negative";
export type MemorySource = "explicit_setting" | "user_feedback" | "behavior_inferred";

export type MemoryRecord = {
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
};

export type TaskCitation = {
  collectionName: string;
  title: string;
  snippet: string;
  source_url: string | null;
};

export type TaskResult = {
  recommended_structure: string[];
  next_steps: string[];
  cautions: string[];
  citations: TaskCitation[];
};

export type TaskRunResult = {
  taskRunId: string;
  result: TaskResult;
};

export type CollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  updatedAt: string;
};

export type CollectionDetail = CollectionSummary & {
  items: Array<{
    id: string;
    title: string;
    sourceUrl: string | null;
    sourceType: string;
    importStatus: string;
    createdAt: string;
    excerpt: string;
  }>;
};
