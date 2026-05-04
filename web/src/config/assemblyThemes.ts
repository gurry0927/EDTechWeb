import type { AssemblyType } from '@/components/game-modes/detective/types'

export type AssemblyThemeId = 'hacker' | 'oracle'

export interface AssemblyTheme {
  id: AssemblyThemeId
  label: string
  briefings: Record<AssemblyType, string>
}

export const ASSEMBLY_THEMES: Record<AssemblyThemeId, AssemblyTheme> = {
  hacker: {
    id: 'hacker',
    label: '駭客',
    briefings: {
      chain:       '系統資料流中斷，情報碎片散落各處。從知識庫提取正確序列，重建完整資料鏈。',
      parallel:    '偵測到多重威脅向量。標記所有符合條件的情報，同時鎖定才能突破防線。',
      elimination: '資料庫遭污染，混入錯誤節點。找出並清除無效碎片，還原正確紀錄。',
      matching:    '加密配對協議啟動。將情報碎片與對應目標完成配對，建立正確連結。',
      conditional: '系統偵測到條件分支。根據情境判斷適用規則，套用正確處理路徑。',
    },
  },
  oracle: {
    id: 'oracle',
    label: '天機',
    briefings: {
      chain:       '天機殘卷現身，推演之鏈已斷。從靈感碎片中還原正確序列，重現完整天機。',
      parallel:    '多重天象同時示警，需集齊所有徵兆方能卜出結果。選出所有應驗的碎片。',
      elimination: '真偽混雜，需去蕪存菁。辨識虛妄之言並排除，天機方得顯現。',
      matching:    '天地對應，陰陽配合。將散落碎片兩兩配對，還原宇宙秩序。',
      conditional: '命運分叉，殊途同歸。判斷眼前情境，選擇正確的推演路徑。',
    },
  },
}
