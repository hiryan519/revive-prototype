alter table task_runs
add column if not exists injected_memory_ids jsonb not null default '[]'::jsonb;
