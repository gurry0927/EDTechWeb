-- detective_questions table
-- 每一題存成一筆，data 欄位是完整的 DetectiveQuestion JSON
create table if not exists detective_questions (
  id text primary key,              -- 對應 DetectiveQuestion.id，如 "114-social-history-20"
  source text not null,             -- 考試來源，如 "114年會考-社會-第20題"
  subject text not null,            -- 科目
  data jsonb not null,              -- 完整 DetectiveQuestion JSON
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 更新時自動刷新 updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger detective_questions_updated_at
  before update on detective_questions
  for each row execute function update_updated_at();

-- 開放 anon 讀寫（單人工具，不需要 RLS）
alter table detective_questions enable row level security;

create policy "allow_all" on detective_questions
  for all using (true) with check (true);
