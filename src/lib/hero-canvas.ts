import type { Slide } from '@/data/drops';
import logo from '@/assets/smol-stuuf-logo.png';
import { assetUrl } from './asset-url';

export type CanvasMode = 'desktop' | 'mobile';
export type CanvasColor = 'paper' | 'ink' | 'red' | 'yellow' | 'cyan' | 'pink' | 'green' | 'white';
export type CanvasRect = { x: number; y: number; width: number; height: number; rotation: number; fontSize: number };
export type HeroElement = {
  id: string; name: string; kind: 'text' | 'image' | 'sticker' | 'button' | 'logo';
  text: string; src: string; href: string; color: CanvasColor; background: CanvasColor | 'transparent';
  bold: boolean; align: 'left' | 'center' | 'right'; locked: boolean; hidden: boolean;
  borderWidth: number; borderColor: CanvasColor; borderRadius: number;
  shadowEnabled: boolean; shadowX: number; shadowY: number; shadowBlur: number; shadowColor: CanvasColor;
  hoverEffect: boolean; hoverShadowX: number; hoverShadowY: number; hoverLift: number; hoverRotation: number;
  animation: 'none' | 'bounce-shadow';
  desktop: CanvasRect; mobile: CanvasRect;
};
export type HeroCanvas = { version: 1; desktop: { height: number; background: CanvasColor }; mobile: { height: number; background: CanvasColor }; elements: HeroElement[] };
export const CANVAS_WIDTH = { desktop: 1180, mobile: 390 };
export const CANVAS_COLORS: CanvasColor[] = ['paper', 'ink', 'red', 'yellow', 'cyan', 'pink', 'green', 'white'];
export const canvasId = () => `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export function newHeroElement(kind: HeroElement['kind'], text = '', src = ''): HeroElement {
  const art = kind === 'sticker' || kind === 'image' || kind === 'logo';
  return { id: canvasId(), name: text || kind, kind, text, src, href: kind === 'button' ? '/shop' : '', color: 'ink', background: kind === 'button' ? 'yellow' : 'transparent', bold: kind !== 'text', align: 'left', locked: false, hidden: false,
    borderWidth: kind === 'button' ? 3 : 0, borderColor: 'ink', borderRadius: kind === 'button' ? 999 : 0,
    shadowEnabled: false, shadowX: kind === 'button' ? 4 : 0, shadowY: kind === 'button' ? 4 : 0, shadowBlur: 0, shadowColor: 'ink',
    hoverEffect: kind === 'button', hoverShadowX: 5, hoverShadowY: 6, hoverLift: 3, hoverRotation: -1, animation: 'none',
    desktop: { x: 60, y: 60, width: art ? 140 : 400, height: art ? 140 : 70, rotation: 0, fontSize: 32 },
    mobile: { x: 24, y: 320, width: art ? 100 : 342, height: art ? 100 : 70, rotation: 0, fontSize: 24 } };
}
export function createHeroCanvas(slide: Slide): HeroCanvas {
  const elements: HeroElement[] = [];
  const add = (kind: HeroElement['kind'], name: string, text: string, src: string, d: Partial<CanvasRect>, m: Partial<CanvasRect>, extra: Partial<HeroElement> = {}) => {
    const e = newHeroElement(kind, text, src);
    elements.push({ ...e, ...extra, name, desktop: { ...e.desktop, ...d }, mobile: { ...e.mobile, ...m } });
  };
  add('text', 'Top line', slide.eyebrow, '', { x: 40, y: 48, width: 490, height: 34, fontSize: 16 }, { x: 24, y: 280, height: 36, fontSize: 13 }, { bold: true });
  add('text', 'Headline', slide.title, '', { x: 40, y: 112, width: 550, height: 82, fontSize: 56 }, { x: 24, y: 330, height: 64, fontSize: 36 }, { bold: true });
  add('text', 'Accent headline', slide.accent, '', { x: 40, y: 198, width: 550, height: 82, fontSize: 56 }, { x: 24, y: 396, height: 64, fontSize: 36 }, { color: 'red', bold: true });
  add('text', 'Description', slide.sub, '', { x: 40, y: 300, width: 475, height: 110, fontSize: 18 }, { x: 24, y: 474, height: 130, fontSize: 16 });
  add('button', 'Main button', slide.cta.label, '', { x: 40, y: 438, width: 218, height: 54, fontSize: 17 }, { x: 24, y: 628, width: 342, height: 48, fontSize: 16 }, { href: slide.cta.to, bold: true });
  add('button', 'Second button', slide.secondary?.label ?? 'Why so smol?', '', { x: 282, y: 438, width: 190, height: 54, fontSize: 17 }, { x: 24, y: 692, width: 342, height: 48, fontSize: 16 }, { href: slide.secondary?.to ?? '/about', bold: true, background: 'paper' });
  add('logo', 'SMOL STUUF logo', '', assetUrl(logo), { x: 650, y: 115, width: 470, height: 320 }, { x: 60, y: 20, width: 270, height: 220 });
  for (const [id, x, y, rotation] of [['eye', 630, 32, -12], ['stuuf-star', 1030, 30, 10], ['peace-sign', 1040, 425, 12], ['good', 580, 390, -10], ['spark-star', 900, 450, 8], ['drop', 990, 310, -6]] as const) {
    add('sticker', id, '', id, { x, y, width: 96, height: 96, rotation }, { x: id === 'eye' ? 8 : 280, y: id === 'eye' ? 80 : 195, width: 70, height: 70, rotation }, { hidden: false });
  }
  if (slide.sticker && !elements.some(e => e.src === slide.sticker)) add('sticker', 'Slide sticker', '', slide.sticker, { x: 520, y: 25, width: 96, height: 96 }, { x: 8, y: 180, width: 70, height: 70 });
  if (slide.image) add('image', 'Slide image', '', slide.image, { x: 680, y: 90, width: 400, height: 340, rotation: slide.rotation ?? 0 }, { x: 70, y: 20, width: 250, height: 220 });
  if (slide.badge) add('text', 'Badge', slide.badge, '', { x: 900, y: 420, width: 210, height: 46, fontSize: 20 }, { x: 220, y: 220, width: 140, height: 36, fontSize: 16 }, { background: 'red', color: 'white', bold: true, align: 'center' });
  return { version: 1, desktop: { height: 560, background: 'paper' }, mobile: { height: 780, background: 'paper' }, elements };
}
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo);
export function constrainRect(rect: CanvasRect, mode: CanvasMode, height: number): CanvasRect {
  const width = clamp(rect.width, 24, CANVAS_WIDTH[mode]);
  const h = clamp(rect.height, 24, height);
  return { ...rect, width, height: h, x: clamp(rect.x, 0, CANVAS_WIDTH[mode] - width), y: clamp(rect.y, 0, height - h), fontSize: clamp(rect.fontSize, 8, 400), rotation: clamp(rect.rotation, -360, 360) };
}
export const safeHeroHref = (href: string) => /^\/(?!\/)|^https?:\/\//i.test(href) ? href : '/shop';
