import type { LessonConfig } from '@/components/taiwan-map';
import { DEFAULT_INSETS, DEFAULT_LIENCHIANG_SPLIT } from '@/components/taiwan-map';

/**
 * 行政區認識 — faithfully reproduces the original TaiwanMap behavior.
 * All counties are interactive, dark-tech theme, standard inset layout.
 */
export const administrativeLesson: LessonConfig = {
  id: 'administrative',
  title: {
    primary: '台灣行政區域圖',
    secondary: 'TAIWAN ADMINISTRATIVE MAP',
  },
  theme: 'dark-tech',
  regions: {},
  defaultInteraction: 'interactive',
  subRegionSplits: [DEFAULT_LIENCHIANG_SPLIT],
  insets: DEFAULT_INSETS,
  displayNames: {
    '桃園縣': '桃園市',
  },
};
