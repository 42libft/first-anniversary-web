import type { Journey } from '../types/journey'

type JourneyInput = Omit<Journey, 'distanceKm'>

const journeyDefinitions: JourneyInput[] = [
  {
    id: 'travel-001',
    title: '初デート — 福岡での出会い',
    date: '2024-10-04',
    steps: [
      {
        id: 'travel-001-flight',
        type: 'move',
        mode: 'flight',
        from: '東京 / 成田',
        to: '福岡',
        distanceKm: 1088,
        artKey: 'night-sky-market',
        fromCoord: [16, 72],
        toCoord: [84, 24],
        meta: {
          flightNo: 'JL123',
          dep: '07:30',
          arr: '09:40',
        },
        description: '成田を飛び立ち、博多の街並みが雲の切れ間に現れた瞬間を共有。',
      },
      {
        id: 'travel-001-episode-airport',
        type: 'episode',
        title: '福岡空港のロビーで初めて手を振った',
        artKey: 'night-sky-market',
        text: [
          '到着ゲートで見つけた笑顔に、長距離の緊張が一気にほどけた。',
          'スーツケースの柄を褒め合いながら、ホテルまでの予定を決めた。',
        ],
        photo: {
          src: '/images/journey-travel-001-airport.svg',
          alt: '夜の空港で待ち合わせるふたりのシルエット',
          objectPosition: 'center top',
        },
      },
      {
        id: 'travel-001-walk',
        type: 'move',
        mode: 'walk',
        from: '福岡空港',
        to: '博多駅前ホテル',
        distanceKm: 3,
        artKey: 'night-sky-market',
        route: [
          [20, 72],
          [36, 68],
          [54, 64],
          [68, 58],
          [78, 52],
        ],
        mapImage: {
          src: '/images/maps/travel-001-walk.svg',
          alt: '福岡空港から博多駅前ホテルへの徒歩ルート',
        },
        description: '空港の通路を抜け、夕方の風を浴びながらホテルへ向かった。',
      },
      {
        id: 'travel-001-episode-night',
        type: 'episode',
        title: '初めての夜、博多の街を眺めながら',
        artKey: 'night-sky-market',
        text: [
          'ホテルの窓際で、空港から持ち帰った香りを分け合った。',
          '眠る前に次の日の散策ルートを描き合い、胸の高鳴りを共有した。',
        ],
        photo: {
          src: '/images/journey-travel-001-night.svg',
          alt: 'ホテルの窓から見える夜の街並み',
          objectPosition: 'center',
        },
      },
      {
        id: 'travel-001-question-food',
        type: 'question',
        style: 'choice',
        prompt: '初めての夜、セブンでふたりが選んだ夜ごはんは？',
        storageKey: 'travel-001-food',
        choices: [
          'おにぎり＆ウーロン茶',
          'サンドイッチ＆カフェラテ',
          'からあげ棒＆コーラ',
        ],
        readonlyAfterSave: true,
      },
      {
        id: 'travel-001-question-feeling',
        type: 'question',
        style: 'text',
        prompt: '初めての夜、どんな気持ちだった？',
        placeholder: '胸に残った言葉をそのまま書き残そう。',
        storageKey: 'travel-001-feeling',
        readonlyAfterSave: true,
      },
    ],
  },
  {
    id: 'travel-002',
    title: 'バレンタイン前夜の逆遠征',
    date: '2024-02-11',
    steps: [
      {
        id: 'travel-002-flight',
        type: 'move',
        mode: 'flight',
        from: '福岡',
        to: '羽田',
        distanceKm: 1088,
        artKey: 'valentine-neon',
        fromCoord: [18, 70],
        toCoord: [82, 22],
        meta: {
          flightNo: 'SKY204',
          dep: '19:05',
          arr: '21:10',
        },
        description: '夜風とともに羽田へ。手荷物のチョコレートを何度も確認した。',
      },
      {
        id: 'travel-002-episode-city',
        type: 'episode',
        title: '東京の展望デッキで秘密会議',
        artKey: 'valentine-neon',
        text: [
          'ネオンに照らされた展望デッキで、明日のサプライズの手順を指差しで共有。',
          '耳元で鳴るアナウンスに紛れて、小さな約束を交わした。',
        ],
        photo: {
          src: '/images/journey-travel-002-deck.svg',
          alt: '展望デッキから見下ろす夜景とチョコレート',
        },
      },
      {
        id: 'travel-002-train',
        type: 'move',
        mode: 'train',
        from: '羽田空港',
        to: '渋谷',
        distanceKm: 18,
        artKey: 'valentine-neon',
        route: [
          [18, 64],
          [30, 56],
          [42, 48],
          [55, 38],
          [72, 28],
        ],
        mapImage: {
          src: '/images/maps/travel-002-train.svg',
          alt: '羽田空港から渋谷駅までの鉄道ルート',
        },
        meta: {
          note: '空港線から渋谷まで乗り換え1回。',
        },
        description: 'モノレールから見える街の灯りに、到着後のプランを重ねた。',
      },
      {
        id: 'travel-002-question-feeling',
        type: 'question',
        style: 'text',
        prompt: 'この夜に考えていたことは？',
        storageKey: 'travel-002-feeling',
        placeholder: '展望デッキで浮かんだ想いをメモしよう。',
        readonlyAfterSave: true,
      },
      {
        id: 'travel-002-question-plan',
        type: 'question',
        style: 'choice',
        prompt: 'サプライズの最終確認で約束したのは？',
        storageKey: 'travel-002-plan',
        choices: [
          '待ち合わせ場所で同時にチョコを渡す',
          '渋谷駅でカフェに寄って一息つく',
          '0時ぴったりにメッセージを送る',
        ],
        readonlyAfterSave: true,
      },
    ],
  },
  {
    id: 'travel-003',
    title: '流星群と夏祭りのフィナーレ',
    date: '2024-07-27',
    steps: [
      {
        id: 'travel-003-flight',
        type: 'move',
        mode: 'flight',
        from: '東京',
        to: '福岡',
        distanceKm: 1088,
        artKey: 'stardust-finale',
        fromCoord: [14, 68],
        toCoord: [86, 26],
        meta: {
          flightNo: 'ANA271',
          dep: '16:20',
          arr: '18:25',
        },
        description: '夕焼けが翼を染め、着陸前に見えた祭りの灯りに心が踊った。',
      },
      {
        id: 'travel-003-bus',
        type: 'move',
        mode: 'bus',
        from: '福岡空港',
        to: '河川敷の夏祭り会場',
        distanceKm: 12,
        artKey: 'stardust-finale',
        route: [
          [22, 70],
          [36, 64],
          [48, 56],
          [62, 46],
          [74, 34],
          [82, 26],
        ],
        mapImage: {
          src: '/images/maps/travel-003-bus.svg',
          alt: '福岡空港から夏祭り会場へのバスルート',
        },
        meta: {
          note: '臨時バスで30分ほどの移動。',
        },
        description: '車窓に映る提灯を指差しながら、到着後の屋台巡りを決めた。',
      },
      {
        id: 'travel-003-episode-festival',
        type: 'episode',
        title: '夏祭りで浴衣の袖が触れた',
        artKey: 'stardust-finale',
        text: [
          '花火の音と流星群の光が重なる瞬間、互いの手を強く握り直した。',
          '帰り道の河川敷で、最後の再会に向けて静かに言葉を紡いだ。',
        ],
        photo: {
          src: '/images/journey-travel-003-festival.svg',
          alt: '夏祭りの提灯と流星群が写った写真',
        },
      },
      {
        id: 'travel-003-episode-letter',
        type: 'episode',
        title: '夜風に溶ける手紙',
        artKey: 'stardust-finale',
        text: [
          '屋台の裏で交換した手紙を読み終え、涙を拭いて笑い合った。',
          '封筒の端に書かれた小さなサインを、記念にそっと撫でた。',
        ],
        photo: {
          src: '/images/journey-travel-003-letter.svg',
          alt: 'ライトアップされた川辺と手紙の封筒',
          objectPosition: 'center bottom',
        },
      },
      {
        id: 'travel-003-question-highlight',
        type: 'question',
        style: 'choice',
        prompt: '一番心に残った瞬間は？',
        storageKey: 'travel-003-highlight',
        choices: [
          '流星群を見上げた瞬間',
          '屋台で食べたかき氷',
          '手紙を交換したとき',
        ],
        readonlyAfterSave: true,
      },
      {
        id: 'travel-003-question-feeling',
        type: 'question',
        style: 'text',
        prompt: '最後に伝えた言葉を覚えてる？',
        storageKey: 'travel-003-feeling',
        placeholder: '夜風と一緒に流れた想いをメモしよう。',
        readonlyAfterSave: true,
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
