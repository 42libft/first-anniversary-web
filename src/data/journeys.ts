import type { Journey } from '../types/journey'

type JourneyInput = Omit<Journey, 'distanceKm'>

const journeyDefinitions: JourneyInput[] = [
  {
    id: 'journey-2023-autumn',
    title: '空フェス夜市が始まった夜',
    date: '2023-10-14',
    steps: [
      {
        id: '2023-autumn-flight',
        type: 'move',
        from: 'Tokyo',
        to: 'Fukuoka',
        transport: 'plane',
        distanceKm: 1080,
        artKey: 'night-sky-market',
        description: '羽田からネオン色の夜市へ。機内アナウンスが幕開けを告げた。',
      },
      {
        id: '2023-autumn-market',
        type: 'episode',
        title: '空フェス夜市で再会',
        caption:
          '提灯が揺れるアーケードで、互いの歩幅が自然に揃った。写真を撮るたびに笑い声が重なる。',
        artKey: 'night-sky-market',
        media: {
          src: 'https://images.placeholders.dev/?width=640&height=900&text=Night+Market',
          alt: '夜市のネオンとふたりの影が写る写真',
          objectPosition: 'center top',
        },
      },
      {
        id: '2023-autumn-question-feeling',
        type: 'question',
        prompt: 'このときどう思った？',
        placeholder: '屋台の匂いや風のあたたかさを、好きな言葉で書き残そう。',
        helper: '回答はローカルに保存され、Resultでそのまま表示されます。',
      },
      {
        id: '2023-autumn-question-highlight',
        type: 'question',
        prompt: '一番印象に残った瞬間は？',
        placeholder: 'ネオンが弾けた瞬間、ふたりで見た景色は？',
      },
    ],
  },
  {
    id: 'journey-2024-valentine',
    title: 'バレンタイン前夜の逆遠征',
    date: '2024-02-11',
    steps: [
      {
        id: '2024-valentine-flight',
        type: 'move',
        from: 'Fukuoka',
        to: 'Tokyo',
        transport: 'plane',
        distanceKm: 1080,
        artKey: 'valentine-neon',
        description: '福岡の夜風を背に、チョコレートを抱えて羽田へ向かう。',
      },
      {
        id: '2024-valentine-city',
        type: 'episode',
        title: '東京の夜景と秘密の計画',
        caption:
          '展望デッキから眺める街はピンクとブルーのグラデーション。明日のサプライズ手順をこっそり指差しで確認した。',
        artKey: 'valentine-neon',
        media: {
          src: 'https://images.placeholders.dev/?width=640&height=900&text=Tokyo+Neon',
          alt: '東京の夜景と渡す予定のチョコレート',
        },
      },
      {
        id: '2024-valentine-question-feeling',
        type: 'question',
        prompt: 'このときどう思った？',
        placeholder: '展望デッキで考えていたこと、胸の高鳴りを書き残そう。',
      },
      {
        id: '2024-valentine-question-highlight',
        type: 'question',
        prompt: '一番印象に残った瞬間は？',
        placeholder: 'チョコを渡すタイミング？それとも夜景？',
      },
    ],
  },
  {
    id: 'journey-2024-summer',
    title: '流星群と夏祭りのフィナーレ',
    date: '2024-07-27',
    steps: [
      {
        id: '2024-summer-flight',
        type: 'move',
        from: 'Tokyo',
        to: 'Fukuoka',
        transport: 'plane',
        distanceKm: 1080,
        artKey: 'stardust-finale',
        description: '夏の雲を突き抜けて福岡へ。コックピットの窓に夕焼けが反射する。',
      },
      {
        id: '2024-summer-festival',
        type: 'episode',
        title: '夏祭りと流星のシャワー',
        caption:
          '浴衣の袖が触れるたびに、屋台の光がぼやける。流星群を浴びながら、最後の再会をゆっくり噛み締めた。',
        artKey: 'stardust-finale',
        media: {
          src: 'https://images.placeholders.dev/?width=640&height=900&text=Summer+Festival',
          alt: '夜空に流れる流星群と夏祭りの提灯',
          objectPosition: 'center',
        },
      },
      {
        id: '2024-summer-bonus',
        type: 'episode',
        title: '夜風に溶ける手紙',
        caption:
          '屋台の裏で交換した手紙。封を開ける指先が震えて、笑いながら握り直した。',
        artKey: 'stardust-finale',
        media: {
          src: 'https://images.placeholders.dev/?width=640&height=900&text=Letter+Exchange',
          alt: 'ライトアップされた川辺と手紙の封筒',
          objectPosition: 'center bottom',
        },
      },
      {
        id: '2024-summer-question-feeling',
        type: 'question',
        prompt: 'このときどう思った？',
        placeholder: '流星の瞬きとリンクした感情をメモ。',
      },
      {
        id: '2024-summer-question-highlight',
        type: 'question',
        prompt: '一番印象に残った瞬間は？',
        placeholder: '夏の夜を締めくくったシーンを書き残そう。',
      },
    ],
  },
]

export const journeys: Journey[] = journeyDefinitions.map((journey) => {
  const distanceKm = journey.steps.reduce((total, step) => {
    if (step.type === 'move') {
      return total + step.distanceKm
    }
    return total
  }, 0)

  return {
    ...journey,
    distanceKm,
  }
})
