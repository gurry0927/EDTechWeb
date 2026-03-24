import type { LessonConfig } from '@/components/taiwan-map';
import { DEFAULT_INSETS, DEFAULT_LIENCHIANG_SPLIT } from '@/components/taiwan-map/defaults';
import {
  municipality,
  county,
  provincialCity,
  GOV_TYPE_COLORS,
} from '@/components/civics-map/types';

// ─── 顏色：預設暗色，hover 亮為螢光色 ───
const FILL = {
  m: '#2A0E1C',   // 暗桃紅
  c: '#062A14',   // 暗綠
  p: '#2A1800',   // 暗橘
};

const HOVER = {
  m: GOV_TYPE_COLORS['直轄市'],   // → 螢光桃紅
  c: GOV_TYPE_COLORS['縣'],       // → 螢光綠
  p: GOV_TYPE_COLORS['省轄市'],   // → 螢光橘
};

// ─── 工具 ───
function m(label: string, extra?: Parameters<typeof municipality>[0]) {
  return {
    label,
    fill: FILL.m,
    hoverFill: HOVER.m,
    group: '直轄市',
    data: municipality(extra),
  };
}

function c(label: string, extra?: Parameters<typeof county>[0]) {
  return {
    label,
    fill: FILL.c,
    hoverFill: HOVER.c,
    group: '縣',
    data: county(extra),
  };
}

function p(label: string) {
  return {
    label,
    fill: FILL.p,
    hoverFill: HOVER.p,
    group: '省轄市',
    data: provincialCity(),
  };
}

// ─── 課程設定 ───
export const civicsLocalGovLesson: LessonConfig = {
  id: 'civics-local-gov',
  title: {
    primary: '台灣地方政府制度',
    secondary: 'LOCAL GOVERNMENT SYSTEM',
  },
  theme: 'dark-tech',
  defaultInteraction: 'interactive',
  subRegionSplits: [DEFAULT_LIENCHIANG_SPLIT],
  insets: DEFAULT_INSETS,
  displayNames: { '桃園縣': '桃園市' },

  regions: {
    // ── 直轄市 (6) ──
    '台北市': m('台北市'),
    '新北市': m('新北市', { hasIndigenousDistrict: true, note: '烏來區為山地原住民區' }),
    '桃園縣': m('桃園市', { hasIndigenousDistrict: true, note: '復興區為山地原住民區' }),
    '台中市': m('台中市', { hasIndigenousDistrict: true, note: '和平區為山地原住民區' }),
    '台南市': m('台南市'),
    '高雄市': m('高雄市', { hasIndigenousDistrict: true, note: '桃源、茂林、那瑪夏區為山地原住民區' }),

    // ── 縣 (13) ──
    '新竹縣': c('新竹縣'),
    '苗栗縣': c('苗栗縣'),
    '彰化縣': c('彰化縣'),
    '南投縣': c('南投縣'),
    '雲林縣': c('雲林縣'),
    '嘉義縣': c('嘉義縣'),
    '屏東縣': c('屏東縣'),
    '宜蘭縣': c('宜蘭縣'),
    '花蓮縣': c('花蓮縣'),
    '台東縣': c('台東縣'),
    '澎湖縣': c('澎湖縣'),
    '金門縣': c('金門縣'),
    '連江縣': c('連江縣'),

    // ── 省轄市 (3) ──
    '基隆市': p('基隆市'),
    '新竹市': p('新竹市'),
    '嘉義市': p('嘉義市'),
  },

  legend: {
    title: '行政層級',
    items: [
      { color: HOVER.m, label: '直轄市（6）', group: '直轄市' },
      { color: HOVER.c, label: '縣（13）', group: '縣' },
      { color: HOVER.p, label: '省轄市（3）', group: '省轄市' },
    ],
    position: 'bottom-right',
  },
};
