/**
 * 首頁 Hero 區域設定 — 每個主題的視覺方案
 *
 * 新增主題 Hero：
 * 1. 在此加一筆設定
 * 2. 完成（ThemeHero 自動吃到）
 */

export interface SimpleHeroConfig {
  variant: 'simple';
}

export interface ImmersiveHeroConfig {
  variant: 'immersive';
  bgVideo: string;          // /public 底下的路徑
  idleImage: string;        // 角色待機圖（去背 PNG）
  lookImage?: string;       // 轉頭版（有則點擊主按鈕時 crossfade）
  // 版面
  charWidthVw: number;      // 角色寬度（vw）
  charMaxWidthPx: number;   // 角色最大寬度（px），防止寬螢幕爆版
  charTopDvh: number;       // 角色頂端距螢幕頂部（dvh），越大越往下
  charOffsetX: number;      // 水平偏移（vw），正右負左
  // 背景煙霧
  smokeOpacity: number;     // 0~1
  fadeSecs: number;         // loop 接縫淡出淡入秒數
  // 漸層遮罩
  gradientHeightDvh: number;
  gradientSolidAt: number;  // 0~100，幾 % 開始完全不透明
}

export type HeroConfig = SimpleHeroConfig | ImmersiveHeroConfig;

export const HERO_REGISTRY: Record<string, HeroConfig> = {
  classic: {
    variant: 'simple',
  },
  cyber: {
    variant: 'simple',
  },
  guofeng: {
    variant: 'immersive',
    bgVideo: '/avatars/darksmoke.mp4',
    idleImage: '/avatars/Jianghu01.png',
    lookImage: '/avatars/Jianghu02.png',
    charWidthVw: 100,
    charMaxWidthPx: 448,
    charTopDvh: 10,
    charOffsetX: 2,
    smokeOpacity: 0.55,
    fadeSecs: 1.5,
    gradientHeightDvh: 20,
    gradientSolidAt: 60,
  },
};
