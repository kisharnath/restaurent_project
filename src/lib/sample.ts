// Build-time helpers: the sample restaurant per style is used to pre-render
// the static HTML (what you see before JS runs and when ?r= is missing/unknown).
import restaurants from '../data/restaurants.json';
export type Style = 'classic' | 'modern' | 'cafe';
export const sampleFor = (style: Style) =>
  restaurants.find((r) => r.style === style) ?? restaurants[0];
export const STYLES: Style[] = ['classic', 'modern', 'cafe'];
export const PHOTOS = (style: Style) => [1, 2, 3, 4].map((n) => `/placeholders/${style}-${n}.webp`);
