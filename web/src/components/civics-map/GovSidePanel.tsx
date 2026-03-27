'use client';

import { useState } from 'react';
import type { LocalGovData } from './types';
import { GOV_TYPE_COLORS } from './types';

interface GovSidePanelProps {
  hoveredRegion: string | null;
  hoveredData: LocalGovData | null;
}

// ─── 共用：必背行政區摘要 ───
function AdminAreaSummary() {
  const pink = GOV_TYPE_COLORS['直轄市'];
  const orange = GOV_TYPE_COLORS['省轄市'];
  return (
    <div className="space-y-4">
      {/* 6 直轄市 */}
      <div>
        <div className="text-xs font-semibold mb-1.5" style={{ color: pink }}>6 直轄市</div>
        <div className="grid grid-cols-3 gap-1.5">
          {['台北', '新北', '桃園', '台中', '台南', '高雄'].map(name => (
            <div key={name} className="text-center py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: `${pink}18`, border: `1px solid ${pink}35`, color: pink }}>
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* 3 省轄市 */}
      <div>
        <div className="text-xs font-semibold mb-1.5" style={{ color: orange }}>3 省轄市</div>
        <div className="grid grid-cols-3 gap-1.5">
          {['基隆', '新竹', '嘉義'].map(name => (
            <div key={name} className="text-center py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: `${orange}18`, border: `1px solid ${orange}35`, color: orange }}>
              {name}
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-lg py-1.5 text-center text-xs"
          style={{ background: `${orange}10`, border: `1px solid ${orange}25` }}>
          <span className="text-white/40">口訣　</span>
          <span className="font-semibold" style={{ color: orange }}>買滷味要加雞心</span>
          <span className="text-white/35">　嘉基新</span>
        </div>
      </div>
    </div>
  );
}

// ─── Card 外殼 ───
function Card({
  title,
  icon,
  children,
  expandable,
  defaultExpanded = true,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <button
        onClick={expandable ? () => setExpanded(!expanded) : undefined}
        className={`w-full flex items-center gap-2 px-4 py-3 text-left ${
          expandable
            ? 'cursor-pointer hover:bg-white/[0.04] transition-colors'
            : 'cursor-default'
        }`}
      >
        <span>{icon}</span>
        <span className="text-sm font-semibold text-white/90">{title}</span>
        {expandable && (
          <span
            className="ml-auto text-white/40 text-xs transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        )}
      </button>
      <div
        className="transition-all duration-300 overflow-hidden"
        style={{
          maxHeight: !expandable || expanded ? 1200 : 0,
          opacity: !expandable || expanded ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

// ─── 樹枝圖節點 ───
function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        border: `1px solid ${color}70`,
        background: `${color}20`,
        color,
      }}
    >
      {text}
    </span>
  );
}

// ─── Card 1：地方制度樹枝圖 ───
function TreeDiagram() {
  const pink = GOV_TYPE_COLORS['直轄市'];
  const green = GOV_TYPE_COLORS['縣'];
  const orange = GOV_TYPE_COLORS['省轄市'];
  const cyan = '#22D3EE';
  const amber = '#FBBF24';
  const gray = '#CBD5E1';

  return (
    <div className="space-y-3">
      {/* 根：中央 */}
      <div className="flex justify-center">
        <Pill text="中央政府" color="#EF4444" />
      </div>
      <div className="text-center text-white/25 text-xs leading-none">│</div>
      <div className="text-center text-xs text-white/50 -mt-1">地方政府</div>

      {/* 兩大分支 */}
      <div className="flex justify-center gap-1">
        <span className="text-white/20 text-xs">┌──────────</span>
        <span className="text-white/20 text-xs">┴</span>
        <span className="text-white/20 text-xs">──────────┐</span>
      </div>

      <div className="flex gap-3">
        {/* 直轄市 */}
        <div
          className="flex-1 flex flex-col items-center gap-2 rounded-lg p-3"
          style={{ background: `${pink}12`, border: `1px solid ${pink}25` }}
        >
          <Pill text="直轄市（6）" color={pink} />
          <div className="flex items-center gap-1.5">
            <Pill text="市政府" color={cyan} />
            <span className="text-white/40 text-xs">⟷</span>
            <Pill text="市議會" color={amber} />
          </div>
          <div className="text-white/25 text-xs">↓</div>
          <div className="flex items-center gap-1.5">
            <Pill text="區" color={gray} />
            <span className="text-white/50 text-xs">→ 區公所</span>
          </div>
          <span className="text-red-400/80 text-xs">（無立法機關）</span>
        </div>

        {/* 省 → 縣 + 省轄市 */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <Pill text="省（虛級化）" color="#888" />
          <div className="flex gap-2 w-full">
            {/* 縣 */}
            <div
              className="flex-1 flex flex-col items-center gap-1.5 rounded-lg p-2.5"
              style={{ background: `${green}12`, border: `1px solid ${green}25` }}
            >
              <Pill text="縣（13）" color={green} />
              <div className="flex items-center gap-1">
                <Pill text="縣政府" color={cyan} />
                <span className="text-white/40 text-[10px]">⟷</span>
                <Pill text="縣議會" color={amber} />
              </div>
              <div className="text-white/25 text-xs">↓</div>
              <Pill text="鄉鎮市" color={gray} />
              <span className="text-emerald-400 text-xs">有代表會 ✓</span>
            </div>

            {/* 省轄市 */}
            <div
              className="flex-1 flex flex-col items-center gap-1.5 rounded-lg p-2.5"
              style={{ background: `${orange}12`, border: `1px solid ${orange}25` }}
            >
              <Pill text="市（3）" color={orange} />
              <div className="flex items-center gap-1">
                <Pill text="市政府" color={cyan} />
                <span className="text-white/40 text-[10px]">⟷</span>
                <Pill text="市議會" color={amber} />
              </div>
              <div className="text-white/25 text-xs">↓</div>
              <Pill text="區" color={gray} />
              <span className="text-red-400/80 text-xs">無立法 ✗</span>
            </div>
          </div>
        </div>
      </div>

      {/* 分權概念 */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="text-white/80 text-xs font-semibold">垂直分權</div>
          <div className="text-white/50 text-xs">中央 ↕ 地方</div>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="text-white/80 text-xs font-semibold">水平分權</div>
          <div className="text-white/50 text-xs">行政 ↔ 立法</div>
        </div>
      </div>

      {/* 特例 */}
      <div className="text-xs text-rose-400/80 text-center pt-1">
        ⚠ 直轄市山地原住民區例外：有民選區長＋區民代表會
      </div>
    </div>
  );
}

// ─── Card 2：Hover 縣市資訊 ───
function HoverInfo({
  regionName,
  govData,
}: {
  regionName: string | null;
  govData: LocalGovData | null;
}) {
  if (!regionName || !govData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="text-3xl opacity-40">🖱</div>
        <div className="text-base text-white/50">移動滑鼠到地圖上的縣市</div>
        <div className="text-sm text-white/35">查看該地區的政府制度</div>
      </div>
    );
  }

  const typeColor = GOV_TYPE_COLORS[govData.type];

  return (
    <div className="space-y-4 py-1">
      {/* 縣市名 + 類型 */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">{regionName}</span>
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: `${typeColor}25`, color: typeColor, border: `1px solid ${typeColor}50` }}
        >
          {govData.type}
        </span>
      </div>

      {/* 首長 */}
      <div className="text-base text-white/60">
        首長：<span className="text-white/90 font-medium">{govData.head}</span>
      </div>

      {/* 行政 ⟷ 立法（水平並排）*/}
      <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
            <span className="text-sm text-white/60">行政</span>
            <span className="text-base text-white/95 font-semibold">{govData.executive}</span>
          </div>
          <span className="text-white/30 text-lg shrink-0">⟷</span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-base text-white/95 font-semibold">{govData.legislative}</span>
            <span className="text-sm text-white/60">立法</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          </div>
        </div>
        <div className="text-center text-white/35 text-xs tracking-widest">平行監督</div>
      </div>

      {/* 下轄 */}
      <div className="text-sm text-white/60 space-y-1.5 pt-1 border-t border-white/10">
        <div className="text-base">
          下轄：<span className="text-white/80">{govData.subdivisionType}</span>
          <span className="text-white/25 mx-1.5">→</span>
          <span className="text-white/80">{govData.subdivisionGov}</span>
        </div>
        <div className="text-sm">
          {govData.subdivisionLeg ? (
            <span className="text-emerald-400">✓ 立法：{govData.subdivisionLeg}</span>
          ) : (
            <span className="text-red-400/80">✗ 無立法機關</span>
          )}
        </div>
      </div>

      {/* 山地原住民區 */}
      {govData.hasIndigenousDistrict && (
        <div
          className="text-sm px-3 py-2.5 rounded-lg"
          style={{ background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.25)', color: 'rgba(251,113,133,0.9)' }}
        >
          ⚠ {govData.note}
        </div>
      )}
    </div>
  );
}

// ─── 主面板（lg 以上顯示） ───
export function GovSidePanel({ hoveredRegion, hoveredData }: GovSidePanelProps) {
  return (
    <div className="w-[340px] xl:w-[380px] shrink-0 space-y-3 p-4 pb-16 overflow-y-auto max-lg:hidden">
      {/* Card 1：縣市資訊（hover 連動） */}
      <Card title="縣市資訊" icon="🏛">
        <HoverInfo regionName={hoveredRegion} govData={hoveredData} />
      </Card>

      {/* Card 3：必背行政區（預設收合，節省空間） */}
      <Card title="必背行政區" icon="📌" expandable defaultExpanded={false}>
        <AdminAreaSummary />
      </Card>

      {/* Card 4：山地原住民區（預設收合，節省空間） */}
      <Card title="山地原住民區" icon="🏔" expandable defaultExpanded={false}>
        <div className="space-y-3">
          <div className="text-sm text-white/50">
            直轄市內具地方自治權之原住民區，有民選區長＋區民代表會
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: '烏來', city: '新北' },
              { name: '復興', city: '桃園' },
              { name: '和平', city: '台中' },
              { name: '桃源', city: '高雄' },
              { name: '茂林', city: '高雄' },
              { name: '那瑪夏', city: '高雄' },
            ].map(({ name, city }) => (
              <div
                key={name}
                className="text-center py-2 rounded-lg"
                style={{
                  background: 'rgba(251,113,133,0.10)',
                  border: '1px solid rgba(251,113,133,0.20)',
                }}
              >
                <div className="text-rose-400 text-sm font-semibold">{name}</div>
                <div className="text-white/40 text-xs">{city}</div>
              </div>
            ))}
          </div>
          <div
            className="text-sm text-center pt-2 pb-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="text-white/50 text-xs mb-1">口訣</div>
            <div className="text-rose-400 font-semibold">
              <ruby>吾<rp>(</rp><rt className="text-white/30 text-[9px]">烏來</rt><rp>)</rp></ruby>來
              <ruby>復興<rp>(</rp><rt className="text-white/30 text-[9px]">復興</rt><rp>)</rp></ruby>
              <ruby>和平<rp>(</rp><rt className="text-white/30 text-[9px]">和平</rt><rp>)</rp></ruby>，在
              <ruby>桃源<rp>(</rp><rt className="text-white/30 text-[9px]">桃源</rt><rp>)</rp></ruby>
              <ruby>茂林<rp>(</rp><rt className="text-white/30 text-[9px]">茂林</rt><rp>)</rp></ruby>的
              <ruby>那馬下<rp>(</rp><rt className="text-white/30 text-[9px]">那瑪夏</rt><rp>)</rp></ruby>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── 行動版底部列（lg 以下顯示） ───
interface GovMobileBarProps extends GovSidePanelProps {
  expanded: boolean;
  onToggle: () => void;
}

export function GovMobileBar({ hoveredRegion, hoveredData, expanded, onToggle }: GovMobileBarProps) {
  return (
    <div
      className="lg:hidden absolute bottom-0 left-0 right-0 z-20 transition-all duration-300"
      style={{
        background: 'rgba(5,5,16,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* 摺疊按鈕 + 即時資訊 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {hoveredRegion && hoveredData ? (
          <>
            <span className="text-base font-bold text-white">{hoveredRegion}</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${GOV_TYPE_COLORS[hoveredData.type]}25`,
                color: GOV_TYPE_COLORS[hoveredData.type],
                border: `1px solid ${GOV_TYPE_COLORS[hoveredData.type]}50`,
              }}
            >
              {hoveredData.type}
            </span>
            <span className="text-xs text-white/50 ml-1">
              {hoveredData.executive} ⟷ {hoveredData.legislative}
            </span>
          </>
        ) : (
          <span className="text-sm text-white/50">點擊縣市查看制度資訊</span>
        )}
        <span
          className="ml-auto text-white/40 text-xs transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▲
        </span>
      </button>

      {/* 展開面板 */}
      <div
        className="transition-all duration-300 overflow-y-auto"
        style={{
          maxHeight: expanded ? '60dvh' : 0,
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="px-4 space-y-3" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          {hoveredRegion && hoveredData && (
            <HoverInfo regionName={hoveredRegion} govData={hoveredData} />
          )}
          <Card title="必背行政區" icon="📌" expandable defaultExpanded={false}>
            <AdminAreaSummary />
          </Card>
          <Card title="山地原住民區" icon="🏔" expandable defaultExpanded={false}>
            <div className="space-y-3">
              <div className="text-sm text-white/50">
                直轄市內具地方自治權之原住民區，有民選區長＋區民代表會
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: '烏來', city: '新北' },
                  { name: '復興', city: '桃園' },
                  { name: '和平', city: '台中' },
                  { name: '桃源', city: '高雄' },
                  { name: '茂林', city: '高雄' },
                  { name: '那瑪夏', city: '高雄' },
                ].map(({ name, city }) => (
                  <div key={name} className="text-center py-2 rounded-lg"
                    style={{ background: 'rgba(251,113,133,0.10)', border: '1px solid rgba(251,113,133,0.20)' }}>
                    <div className="text-rose-400 text-sm font-semibold">{name}</div>
                    <div className="text-white/40 text-xs">{city}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg py-2 text-center"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-white/40 text-xs mb-1">口訣</div>
                <div className="text-rose-400 font-semibold text-sm">
                  吾來復興和平，在桃源茂林的那馬下
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
