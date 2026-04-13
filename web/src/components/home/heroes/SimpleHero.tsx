'use client';

import Image from 'next/image';
import { THEME_REGISTRY } from '@/config/themes';

interface Props {
  themeId: string;
  onCharClick: () => void;
}

export function SimpleHero({ themeId, onCharClick }: Props) {
  const avatar = THEME_REGISTRY[themeId]?.avatar.detective ?? '🕵️';
  const isImage = avatar.startsWith('/');

  return (
    <button
      onClick={onCharClick}
      className="relative z-10 flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      title="切換主題"
    >
      <div className={isImage ? 'animate-float' : ''}>
        {isImage ? (
          <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
            <Image
              src={avatar}
              alt="角色圖示"
              width={192}
              height={192}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        ) : (
          <span className="text-[10rem] sm:text-[12rem] leading-none">{avatar}</span>
        )}
      </div>
    </button>
  );
}
