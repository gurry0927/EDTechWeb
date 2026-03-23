import type { LessonConfig } from '@/components/taiwan-map';
import { DEFAULT_INSETS, DEFAULT_LIENCHIANG_SPLIT } from '@/components/taiwan-map';

/**
 * 原住民族分布 — demonstrates per-region interactivity, sub-region splitting,
 * custom fills, and legend. Non-indigenous regions are static (greyed out).
 */
export const indigenousLesson: LessonConfig = {
  id: 'indigenous',
  title: {
    primary: '台灣原住民族分布圖',
    secondary: 'TAIWAN INDIGENOUS PEOPLES MAP',
  },
  theme: 'dark-tech',
  defaultInteraction: 'static',
  regions: {
    // 泰雅族 regions
    '新竹縣': { interaction: 'interactive', fill: '#7B3F00', hoverFill: '#9B5F20', group: '泰雅族', label: '新竹縣' },
    '苗栗縣': { interaction: 'interactive', fill: '#7B3F00', hoverFill: '#9B5F20', group: '泰雅族', label: '苗栗縣' },
    '桃園縣': { interaction: 'interactive', fill: '#7B3F00', hoverFill: '#9B5F20', group: '泰雅族', label: '桃園市' },
    '新北市': { interaction: 'interactive', fill: '#7B3F00', hoverFill: '#9B5F20', group: '泰雅族', label: '新北市' },
    '台中市': { interaction: 'interactive', fill: '#7B3F00', hoverFill: '#9B5F20', group: '泰雅族', label: '台中市' },
    '宜蘭縣': { interaction: 'interactive', fill: '#7B3F00', hoverFill: '#9B5F20', group: '泰雅族', label: '宜蘭縣' },
    // 阿美族 regions
    '花蓮縣': { interaction: 'interactive', fill: '#CD853F', hoverFill: '#E8A86E', group: '阿美族', label: '花蓮縣' },
    '台東縣': { interaction: 'interactive', fill: '#CD853F', hoverFill: '#E8A86E', group: '阿美族', label: '台東縣' },
    // 排灣族
    '屏東縣': { interaction: 'interactive', fill: '#DAA520', hoverFill: '#F0C050', group: '排灣族', label: '屏東縣' },
    // 布農族
    '南投縣': { interaction: 'interactive', fill: '#8B6914', hoverFill: '#AB8934', group: '布農族', label: '南投縣' },
    // 鄒族
    '嘉義縣': { interaction: 'interactive', fill: '#A0522D', hoverFill: '#C0724D', group: '鄒族', label: '嘉義縣' },
    // 魯凱族 / 拉阿魯哇族 / 卡那卡那富族
    '高雄市': { interaction: 'interactive', fill: '#B8860B', hoverFill: '#D8A62B', group: '魯凱族', label: '高雄市' },
    // 達悟族 (蘭嶼 — split from 台東)
    '蘭嶼': { interaction: 'interactive', fill: '#4682B4', hoverFill: '#6CA6D4', group: '達悟族', label: '蘭嶼（達悟族）' },
  },
  subRegionSplits: [
    DEFAULT_LIENCHIANG_SPLIT,
    {
      sourceCounty: '台東縣',
      classify: (center) => center[0] > 121.3 ? '蘭嶼' : '台東縣',
      regions: {
        '蘭嶼': { label: '蘭嶼（達悟族）' },
        '台東縣': { label: '台東縣' },
      },
    },
  ],
  insets: DEFAULT_INSETS,
  legend: {
    title: '原住民族群',
    items: [
      { color: '#7B3F00', label: '泰雅族' },
      { color: '#CD853F', label: '阿美族' },
      { color: '#DAA520', label: '排灣族' },
      { color: '#8B6914', label: '布農族' },
      { color: '#A0522D', label: '鄒族' },
      { color: '#B8860B', label: '魯凱族' },
      { color: '#4682B4', label: '達悟族' },
    ],
    position: 'bottom-right',
  },
  displayNames: {
    '桃園縣': '桃園市',
  },
};
