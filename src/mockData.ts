import { JamiaClass } from './types';

export const DARJA_NAMES = [
  'اولیٰ',
  'ثانیہ',
  'ثالثہ',
  'رابعہ',
  'خامسہ',
  'سادسہ',
  'سابعہ',
  'دورة الحديث',
] as const;

export const SPECIAL_CATEGORIES = [
  'استاذ',
  'عوام',
] as const;

export const ALL_CATEGORY_NAMES = [
  ...DARJA_NAMES,
  ...SPECIAL_CATEGORIES,
] as const;

export const INITIAL_CLASSES_DATA: JamiaClass[] = ALL_CATEGORY_NAMES.map((name, idx) => ({
  id: `c${idx + 1}`,
  name,
  totalDurood: 0,
  rank: idx + 1,
}));
