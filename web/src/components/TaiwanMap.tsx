'use client';

import { InteractiveMap } from './taiwan-map';
import { administrativeLesson } from '@/lessons';

export default function TaiwanMap() {
  return <InteractiveMap config={administrativeLesson} />;
}
