'use client';

import { InsetBox } from './InsetBox';
import type { InsetRenderData } from './types';

export function MapInsets({ insets }: { insets: InsetRenderData[] }) {
  return (
    <>
      {insets.map((inset, i) => (
        <InsetBox key={i} {...inset} />
      ))}
    </>
  );
}
