'use client';

import { usePathname } from 'next/navigation';

export function PageTransition() {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      className="page-wipe-out fixed inset-0 z-[99] pointer-events-none"
      style={{ background: '#0a0806' }}
    />
  );
}
