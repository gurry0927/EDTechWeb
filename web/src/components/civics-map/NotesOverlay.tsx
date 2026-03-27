'use client';

import { GOV_TYPE_COLORS } from './types';

const pink = GOV_TYPE_COLORS['直轄市'];
const green = GOV_TYPE_COLORS['縣'];
const orange = GOV_TYPE_COLORS['省轄市'];
const cyan = '#22D3EE';
const amber = '#FBBF24';

function Pill({ text, color, size = 'sm' }: { text: string; color: string; size?: 'xs' | 'sm' }) {
  const cls = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${cls}`}
      style={{ background: `${color}20`, color, border: `1px solid ${color}50` }}
    >
      {text}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-white/50 uppercase tracking-widest pb-1 border-b border-white/10">
      {children}
    </div>
  );
}

export function NotesOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col overflow-hidden"
      style={{ background: 'rgba(5,5,16,0.97)', backdropFilter: 'blur(10px)' }}
    >
      {/* ── Header（僅標題，不放關閉按鈕）── */}
      <div
        className="shrink-0 flex items-center gap-2 px-5 py-3 text-white/85 font-semibold text-sm"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}
      >
        <span>📋</span>
        <span>地方制度筆記</span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* ── 樹狀結構 ── */}
        <div>
          <SectionTitle>行政層級樹狀圖</SectionTitle>
          <div className="mt-3 space-y-2">

            <div className="flex justify-center">
              <Pill text="中央政府" color="#EF4444" />
            </div>
            <div className="text-center text-white/25 text-xs leading-tight">│</div>
            <div className="text-center text-white/50 text-xs">地方政府</div>
            <div className="text-center text-white/25 text-xs leading-tight">│</div>

            <div className="flex gap-3">
              {/* 直轄市 */}
              <div
                className="flex-1 flex flex-col items-center gap-2 rounded-xl p-3"
                style={{ background: `${pink}10`, border: `1px solid ${pink}30` }}
              >
                <Pill text="直轄市（6）" color={pink} />
                <div className="flex items-center gap-1">
                  <Pill text="市政府" color={cyan} size="xs" />
                  <span className="text-white/30 text-[10px]">⟷</span>
                  <Pill text="市議會" color={amber} size="xs" />
                </div>
                <div className="text-white/25 text-[10px] leading-none">↓</div>
                <div className="flex items-center gap-1">
                  <Pill text="區" color="#94A3B8" size="xs" />
                  <span className="text-white/40 text-[10px]">→</span>
                  <Pill text="區公所" color={cyan} size="xs" />
                </div>
                <span className="text-red-400/80 text-[10px]">✗ 無立法機關</span>

                {/* 山地原住民區 */}
                <div
                  className="w-full rounded-lg p-2 space-y-1.5 text-center"
                  style={{ background: 'rgba(251,113,133,0.10)', border: '1px dashed rgba(251,113,133,0.35)' }}
                >
                  <div className="text-rose-400 text-[10px] font-semibold">⚠ 山地原住民區（例外）</div>
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    <Pill text="區公所" color={cyan} size="xs" />
                    <span className="text-white/30 text-[9px]">⟷</span>
                    <Pill text="區民代表會" color={amber} size="xs" />
                  </div>
                  <div className="text-emerald-400 text-[10px]">✓ 有立法機關</div>
                </div>
              </div>

              {/* 省 → 縣 + 省轄市 */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <Pill text="省（虛級化）" color="#64748B" />
                <div className="text-white/25 text-[10px] leading-none">│</div>

                <div className="flex gap-2 w-full">
                  {/* 縣 */}
                  <div
                    className="flex-1 flex flex-col items-center gap-1.5 rounded-xl p-2.5"
                    style={{ background: `${green}10`, border: `1px solid ${green}30` }}
                  >
                    <Pill text="縣（13）" color={green} />
                    <div className="flex items-center gap-0.5 flex-wrap justify-center">
                      <Pill text="縣政府" color={cyan} size="xs" />
                      <span className="text-white/30 text-[9px]">⟷</span>
                      <Pill text="縣議會" color={amber} size="xs" />
                    </div>
                    <div className="text-white/25 text-[10px] leading-none">↓</div>
                    <Pill text="鄉 / 鎮 / 縣轄市" color="#94A3B8" size="xs" />
                    <div className="flex items-center gap-0.5 flex-wrap justify-center">
                      <Pill text="公所" color={cyan} size="xs" />
                      <span className="text-white/30 text-[9px]">⟷</span>
                      <Pill text="代表會" color={amber} size="xs" />
                    </div>
                    <span className="text-emerald-400 text-[10px]">✓ 有立法機關</span>
                  </div>

                  {/* 省轄市 */}
                  <div
                    className="flex-1 flex flex-col items-center gap-1.5 rounded-xl p-2.5"
                    style={{ background: `${orange}10`, border: `1px solid ${orange}30` }}
                  >
                    <Pill text="省轄市（3）" color={orange} />
                    <div className="flex items-center gap-0.5 flex-wrap justify-center">
                      <Pill text="市政府" color={cyan} size="xs" />
                      <span className="text-white/30 text-[9px]">⟷</span>
                      <Pill text="市議會" color={amber} size="xs" />
                    </div>
                    <div className="text-white/25 text-[10px] leading-none">↓</div>
                    <Pill text="區" color="#94A3B8" size="xs" />
                    <Pill text="區公所" color={cyan} size="xs" />
                    <span className="text-red-400/80 text-[10px]">✗ 無立法機關</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 分權概念 */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-white/80 text-xs font-semibold">垂直分權</div>
                <div className="text-white/50 text-xs">中央 ↕ 地方</div>
                <div className="text-white/35 text-[10px]">均權制度 · 分權制衡</div>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-white/80 text-xs font-semibold">水平分權</div>
                <div className="text-white/50 text-xs">行政 ↔ 立法</div>
                <div className="text-white/35 text-[10px]">機關平行監督</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 必背行政區（方塊版面）── */}
        <div>
          <SectionTitle>📌 必背行政區</SectionTitle>
          <div className="mt-3 space-y-4">

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
        </div>

        {/* ── 山地原住民區 ── */}
        <div>
          <SectionTitle>🏔 山地原住民區（6 個）</SectionTitle>
          <div className="mt-3 grid grid-cols-3 gap-2">
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
                style={{ background: 'rgba(251,113,133,0.10)', border: '1px solid rgba(251,113,133,0.22)' }}
              >
                <div className="text-rose-400 text-sm font-semibold">{name}</div>
                <div className="text-white/40 text-xs">{city}</div>
              </div>
            ))}
          </div>

          {/* 原住民區口訣 */}
          <div
            className="mt-3 rounded-xl p-3 text-center"
            style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.22)' }}
          >
            <div className="text-white/40 text-xs mb-2">口訣</div>
            <div className="text-rose-400 font-semibold text-sm leading-relaxed">
              <ruby>吾<rp>(</rp><rt className="text-white/30 text-[9px]">烏來</rt><rp>)</rp></ruby>來
              <ruby>復興<rp>(</rp><rt className="text-white/30 text-[9px]">復興</rt><rp>)</rp></ruby>
              <ruby>和平<rp>(</rp><rt className="text-white/30 text-[9px]">和平</rt><rp>)</rp></ruby>，在
              <ruby>桃源<rp>(</rp><rt className="text-white/30 text-[9px]">桃源</rt><rp>)</rp></ruby>
              <ruby>茂林<rp>(</rp><rt className="text-white/30 text-[9px]">茂林</rt><rp>)</rp></ruby>的
              <ruby>那馬下<rp>(</rp><rt className="text-white/30 text-[9px]">那瑪夏</rt><rp>)</rp></ruby>
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer：關閉按鈕（遠離頂部攔截層）── */}
      <div
        className="shrink-0 flex justify-center px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <span>✕</span>
          <span>關閉筆記</span>
        </button>
      </div>
    </div>
  );
}
