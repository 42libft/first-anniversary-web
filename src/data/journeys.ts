import type { Journey } from '../types/journey'

const defaultPrompts = [
  'このときどう思った？',
  '一番印象に残った瞬間は？',
]

export const journeys: Journey[] = [
  {
    date: '2023-10-14',
    from: 'Tokyo',
    to: 'Fukuoka',
    transport: 'plane',
    caption: '秋の空フェスをきっかけに、ふたりの距離が一気に縮まった旅のはじまり。',
    photoURL: 'https://images.placeholders.dev/?width=600&height=900&text=Fukuoka+Arrival',
    artKey: 'night-sky-market',
    distanceKm: 1080,
    prompts: defaultPrompts.map((q) => ({ q })),
  },
  {
    date: '2024-02-11',
    from: 'Fukuoka',
    to: 'Tokyo',
    transport: 'plane',
    caption: 'バレンタイン前に東京を案内。夜景とチョコと秘密の計画。',
    photoURL: 'https://images.placeholders.dev/?width=600&height=900&text=Tokyo+Night',
    artKey: 'valentine-neon',
    distanceKm: 1080,
    prompts: defaultPrompts.map((q) => ({ q })),
  },
  {
    date: '2024-07-27',
    from: 'Tokyo',
    to: 'Fukuoka',
    transport: 'plane',
    caption: '夏祭りと流星群。ふたりの一年を締めくくる、とっておきの再会。',
    photoURL: 'https://images.placeholders.dev/?width=600&height=900&text=Summer+Festival',
    artKey: 'stardust-finale',
    distanceKm: 1080,
    prompts: defaultPrompts.map((q) => ({ q })),
  },
]
