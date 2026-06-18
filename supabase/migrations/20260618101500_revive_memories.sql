create table if not exists memories (
  id text primary key,
  user_id text not null,
  scope text not null check (scope in ('global', 'task_type')),
  task_type text check (task_type in ('plan', 'review', 'report')),
  dimension text not null check (dimension in ('output_structure', 'citation_style', 'expression_style', 'task_structure')),
  value text not null,
  polarity text not null default 'positive' check (polarity in ('positive', 'negative')),
  source text not null check (source in ('explicit_setting', 'user_feedback', 'behavior_inferred')),
  source_detail text,
  confidence real not null default 1.0,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint memories_scope_task_type_check check (
    (scope = 'global' and task_type is null)
    or
    (scope = 'task_type' and task_type is not null)
  )
);

create index if not exists idx_memories_user_id on memories(user_id);
create index if not exists idx_memories_scope_task_type on memories(user_id, scope, task_type);
create index if not exists idx_memories_enabled on memories(user_id, enabled);

drop trigger if exists memories_set_updated_at on memories;
create trigger memories_set_updated_at
before update on memories
for each row
execute function set_updated_at();
