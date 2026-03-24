export type GovType = '直轄市' | '縣' | '省轄市';

export interface LocalGovData {
  type: GovType;
  executive: string;
  legislative: string;
  head: string;
  subdivisionType: string;
  subdivisionGov: string;
  subdivisionLeg: string | null;
  hasIndigenousDistrict?: boolean;
  note?: string;
}

/** Runtime type guard for data from MapCallbacks */
export function isLocalGovData(d: unknown): d is LocalGovData {
  return d != null && typeof d === 'object' && 'type' in d && 'executive' in d;
}

type GovExtra = Pick<LocalGovData, 'hasIndigenousDistrict' | 'note'>;

const MUNICIPALITY: LocalGovData = {
  type: '直轄市',
  executive: '市政府',
  legislative: '市議會',
  head: '市長',
  subdivisionType: '區',
  subdivisionGov: '區公所',
  subdivisionLeg: null,
};

const COUNTY: LocalGovData = {
  type: '縣',
  executive: '縣政府',
  legislative: '縣議會',
  head: '縣長',
  subdivisionType: '鄉 / 鎮 / 縣轄市',
  subdivisionGov: '鄉鎮市公所',
  subdivisionLeg: '鄉鎮市民代表會',
};

const PROVINCIAL_CITY: LocalGovData = {
  type: '省轄市',
  executive: '市政府',
  legislative: '市議會',
  head: '市長',
  subdivisionType: '區',
  subdivisionGov: '區公所',
  subdivisionLeg: null,
};

// Factory functions cast to Record<string, unknown> at this single boundary
// so that LocalGovData itself stays type-safe (no index signature).
export function municipality(extra?: GovExtra): Record<string, unknown> {
  return { ...MUNICIPALITY, ...extra };
}

export function county(extra?: GovExtra): Record<string, unknown> {
  return { ...COUNTY, ...extra };
}

export function provincialCity(extra?: GovExtra): Record<string, unknown> {
  return { ...PROVINCIAL_CITY, ...extra };
}

/** 類型對應的顯示顏色（螢光色系） */
export const GOV_TYPE_COLORS: Record<GovType, string> = {
  '直轄市': '#FF2D78',   // 螢光桃紅
  '縣': '#00FF88',        // 螢光綠
  '省轄市': '#FF8C00',    // 螢光橘
};
