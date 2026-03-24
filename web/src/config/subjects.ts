import type { SubjectConfig } from './types';

/**
 * 科目與課程設定。
 * 新增科目或課程只需在這裡加入，首頁和科目頁會自動顯示。
 */
export const subjects: SubjectConfig[] = [
  {
    id: 'geography',
    name: '地理',
    description: '探索台灣的地形、氣候與人文地理',
    icon: '🌏',
    color: '#3B82F6',
    courses: [
      {
        id: 'taiwan-map',
        title: '台灣行政區域互動地圖',
        description: '認識台灣 22 個縣市的位置與分布，支援行政區與原住民族兩種課程模式',
        path: '/taiwan-map',
        tags: ['互動', '地圖', '縣市'],
      },
    ],
  },
  {
    id: 'history',
    name: '歷史',
    description: '穿越時空，了解台灣與世界的歷史脈絡',
    icon: '📜',
    color: '#F59E0B',
    courses: [],
  },
  {
    id: 'civics',
    name: '公民',
    description: '認識民主制度、法律與公民素養',
    icon: '⚖️',
    color: '#8B5CF6',
    courses: [
      {
        id: 'local-gov',
        title: '地方政府制度',
        description: '認識直轄市、縣、省轄市的政府組織與層級關係',
        path: '/civics-local-gov',
        tags: ['互動', '地圖', '地方制度'],
      },
    ],
  },
  {
    id: 'science',
    name: '自然科學',
    description: '探索物理、化學、生物與地球科學',
    icon: '🔬',
    color: '#10B981',
    courses: [],
  },
];

/** 與 app/ 下靜態路由衝突的保留名稱 */
const RESERVED_IDS = ['taiwan-map', 'civics-local-gov', 'api', 'admin'];

if (process.env.NODE_ENV === 'development') {
  for (const s of subjects) {
    if (RESERVED_IDS.includes(s.id)) {
      throw new Error(`Subject id "${s.id}" 與靜態路由衝突，請換一個 id`);
    }
  }
}

export function getSubject(id: string): SubjectConfig | undefined {
  return subjects.find(s => s.id === id);
}
