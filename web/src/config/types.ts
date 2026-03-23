/** 單一課程 */
export interface CourseConfig {
  id: string;
  title: string;
  description: string;
  /** 課程頁面路由，例如 '/geography/taiwan-map' */
  path: string;
  tags?: string[];
  /** 是否為全螢幕沉浸式（預設 true） */
  immersive?: boolean;
}

/** 單一科目 */
export interface SubjectConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 卡片強調色 */
  color: string;
  courses: CourseConfig[];
}
