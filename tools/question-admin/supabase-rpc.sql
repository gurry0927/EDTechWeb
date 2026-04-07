-- =============================================
-- 公開 API：列表 / 初始顯示用（不含答案和線索）
-- =============================================
create or replace function get_public_questions()
returns setof jsonb
language sql stable security definer
as $$
  select jsonb_build_object(
    'id',          data->>'id',
    'source',      data->>'source',
    'subject',     data->>'subject',
    'difficulty',  data->'difficulty',
    'tags',        data->'tags',
    'subSubject',  data->>'subSubject',
    'gradeLevel',  data->>'gradeLevel',
    'mainStem',    data->>'mainStem',
    'figure',      data->>'figure',
    'figureImage', data->>'figureImage',
    'options',     data->'options',
    'caseQuestion', data->>'caseQuestion',
    'startHint',   data->>'startHint'
  )
  from detective_questions
  order by id;
$$;

-- =============================================
-- 機密 API：使用者開始互動後才呼叫（完整資料）
-- =============================================
create or replace function get_question_detail(question_id text)
returns jsonb
language sql stable security definer
as $$
  select data
  from detective_questions
  where id = question_id
  limit 1;
$$;

-- 授權 anon 角色呼叫
grant execute on function get_public_questions() to anon;
grant execute on function get_question_detail(text) to anon;
