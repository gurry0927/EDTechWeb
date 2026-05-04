/**
 * 組裝模式的主題台詞 — 對應全站三個主題 id（classic / cyber / guofeng）
 * 主題視覺（顏色、字體）由全站系統處理，這裡只放台詞。
 */
import type { AssemblyType } from '@/components/game-modes/detective/types';

export interface AssemblyThemeBriefings {
  briefings: Record<AssemblyType, string>;
}

export const ASSEMBLY_BRIEFINGS: Record<string, AssemblyThemeBriefings> = {
  classic: {
    briefings: {
      chain:       '線索散落在筆記中，請按推理順序重建事件鏈，找出真相。',
      parallel:    '多重證據需要同時掌握。標記所有相關線索，案情才能水落石出。',
      elimination: '筆記中混入了誤導資訊。剔除錯誤的部分，留下可信線索。',
      matching:    '證物與證人需要兩兩比對。將線索與對應目標配對，建立關聯。',
      conditional: '案情有不同分支可能。判斷情境後，選擇正確的推理路徑。',
    },
  },
  cyber: {
    briefings: {
      chain:       '系統資料流中斷，情報碎片散落各處。從知識庫提取正確序列，重建完整資料鏈。',
      parallel:    '偵測到多重威脅向量。標記所有符合條件的情報，同時鎖定才能突破防線。',
      elimination: '資料庫遭污染，混入錯誤節點。找出並清除無效碎片，還原正確紀錄。',
      matching:    '加密配對協議啟動。將情報碎片與對應目標完成配對，建立正確連結。',
      conditional: '系統偵測到條件分支。根據情境判斷適用規則，套用正確處理路徑。',
    },
  },
  guofeng: {
    briefings: {
      chain:       '天機殘卷現身，推演之鏈已斷。從靈感碎片中還原正確序列，重現完整天機。',
      parallel:    '多重天象同時示警，需集齊所有徵兆方能卜出結果。選出所有應驗的碎片。',
      elimination: '真偽混雜，需去蕪存菁。辨識虛妄之言並排除，天機方得顯現。',
      matching:    '天地對應，陰陽配合。將散落碎片兩兩配對，還原宇宙秩序。',
      conditional: '命運分叉，殊途同歸。判斷眼前情境，選擇正確的推演路徑。',
    },
  },
};

/** 各主題的標籤（顯示在 UI 角落） */
export const ASSEMBLY_THEME_LABELS: Record<string, string> = {
  classic: '推理',
  cyber: '駭客',
  guofeng: '天機',
};
