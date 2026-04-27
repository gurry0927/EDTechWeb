#!/usr/bin/env node
/**
 * 批次上傳題目 JSON 到 Supabase
 * 用法：node batch-upload.mjs [glob pattern]
 * 範例：node batch-upload.mjs "../../web/src/data/questions/114-nature-*.json"
 * 不帶參數：上傳所有 ../../web/src/data/questions/*.json
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';

const SUPABASE_URL = 'https://lpnziqkignylxhoqpofh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ynZS5wMKFijoare6UgcP7Q_wdHKctS0';
const TABLE = 'detective_questions';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 決定要上傳哪些檔案
const questionsDir = resolve(import.meta.dirname, '../../web/src/data/questions');
const pattern = process.argv[2]; // 可選的 glob pattern

let files;
if (pattern) {
  // 簡單 pattern matching（支援 * 通配）
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  files = readdirSync(questionsDir)
    .filter(f => f.endsWith('.json') && regex.test(f));
} else {
  files = readdirSync(questionsDir).filter(f => f.endsWith('.json'));
}

if (files.length === 0) {
  console.log('❌ 沒有找到 JSON 檔案');
  process.exit(1);
}

console.log(`📦 找到 ${files.length} 個題目檔案：`);
files.forEach(f => console.log(`   ${f}`));
console.log('');

let success = 0;
let failed = 0;

for (const file of files) {
  const path = resolve(questionsDir, file);
  try {
    const raw = readFileSync(path, 'utf8');
    const q = JSON.parse(raw);

    if (!q.id || !q.source || !q.subject) {
      console.log(`⚠️  ${file}: 缺少 id/source/subject，跳過`);
      failed++;
      continue;
    }

    const { error } = await supabase
      .from(TABLE)
      .upsert({
        id: q.id,
        source: q.source,
        subject: q.subject,
        data: q,
      }, { onConflict: 'id' });

    if (error) {
      console.log(`❌ ${file}: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${q.id} — ${q.source}`);
      success++;
    }
  } catch (e) {
    console.log(`❌ ${file}: ${e.message}`);
    failed++;
  }
}

console.log(`\n📊 結果：${success} 成功，${failed} 失敗，共 ${files.length} 個檔案`);
