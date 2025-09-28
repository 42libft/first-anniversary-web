import type { Journey } from '../types/journey'

type JourneyInput = Omit<Journey, 'distanceKm'>

// 追記用: journeys.ts の末尾 or journeyDefinitions 直下に貼り付け
// 型: JourneyInput は `type JourneyInput = Omit<Journey, 'distanceKm'>` 前提
const newJourneyDefinitions: JourneyInput[] = [
  // === 初対面のデート（1日目） 2024-10-29 ===
  {
    id: 'first-date-2024-10-29',
    title: '初対面のデート（1日目）',
    date: '2024-10-29',
    steps: [
      {
        id: 'fd-20241029-flight-nrt-fuk',
        type: 'move',
        mode: 'flight',
        from: '家／成田',
        to: '福岡',
        distanceKm: 1216,
        artKey: 'night-sky-market',
        description: '家→成田→福岡。はじめての旅路。'
      },
      {
        id: 'fd-20241029-episode-airport',
        type: 'episode',
        title: '空港のロビーで初めて出会う！',
        artKey: 'night-sky-market',
        text: [
          'あやねは恥ずかしがり屋で目が合わない。本を3冊くらい持参していた。'
        ],
        photo: {
          src: '/images/user/IMG_0642.jpeg',
          alt: '初対面の空港ロビー'
        }
      },
      {
        id: 'fd-20241029-q-first-impression',
        type: 'question',
        style: 'text',
        prompt: '初めての第一印象は？',
        storageKey: 'fd-20241029-first-impression',
        readonlyAfterSave: true,
        placeholder: '感じたことをそのまま書こう'
      },
      {
        id: 'fd-20241029-move-walk-hakata-hotel',
        type: 'move',
        mode: 'walk',
        from: '博多駅',
        to: 'ホテル',
        distanceKm: 3,
        artKey: 'night-sky-market',
        description:
          '博多駅からホテルまで歩いた。スーツケースを持ってあげたかったが言い出せず。'
      },
      {
        id: 'fd-20241029-episode-hotel',
        type: 'episode',
        title: 'ハロウィン仕様の可愛いホテル',
        artKey: 'night-sky-market',
        text: [
          '部屋は狭いけれど変なホテルじゃなくてよかった。ハロウィン仕様が可愛い。'
        ],
        photo: {
          src: '/images/user/IMG_0652.jpeg',
          alt: 'ホテル内装'
        }
      },
      {
        id: 'fd-20241029-quiz-conveni',
        type: 'question',
        style: 'choice',
        prompt: '初めて二人で寄ったコンビニは？',
        storageKey: 'fd-20241029-conveni',
        choices: ['セブンイレブン', 'ファミリーマート', 'ローソン', 'ミニストップ'],
        correctAnswer: 'セブンイレブン',
        readonlyAfterSave: true,
        helper: '思い出せる選択肢を選んでね'
      },
      {
        id: 'fd-20241029-episode-dinner',
        type: 'episode',
        title: '初めての夜ご飯はセブンイレブン',
        artKey: 'night-sky-market',
        text: [
          '匂いが気にならないものを選んだつもりが、あやねは担々麺をスープまで完食。そこが可愛い！',
          '寝るころには夜が明けていた。'
        ],
        photo: {
          src: '/images/gimmie-placeholder.svg',
          alt: '夜食のイメージ（プレースホルダー）'
        }
      }
    ]
  },

  // === 初対面のデート（2日目） 2024-10-30 ===
  {
    id: 'first-date-2024-10-30',
    title: '初対面のデート（2日目）',
    date: '2024-10-30',
    steps: [
      {
        id: 'fd-20241030-episode-oversleep',
        type: 'episode',
        title: '寝坊でレイトチェックアウト→カービーカフェへ',
        artKey: 'night-sky-market',
        text: [
          '時間ギリギリで移動。エスカレーターで撮った写真が最初の一枚。',
          'ローストビーフ丼のソースをかけ忘れて完食する事件発生。'
        ],
        photo: {
          src: '/images/user/IMG_0660.jpeg',
          alt: '移動中の一枚'
        }
      },
      {
        id: 'fd-20241030-episode-kirby',
        type: 'episode',
        title: 'カービーカフェにぎりぎり間に合う',
        artKey: 'night-sky-market',
        text: ['あやねご満悦。内装の写真をたくさん撮った。'],
        photo: { src: '/images/user/IMG_0717.jpeg', alt: 'カービーカフェ' }
      },
      {
        id: 'fd-20241030-episode-shopping-catcafe',
        type: 'episode',
        title: 'キャナル→無印→ねこカフェ（貸切）',
        artKey: 'night-sky-market',
        text: [
          '無印でクッションを抱っこ。予定どおり猫カフェへ。どっちも可愛い！',
          '服を買うミッションは失敗。'
        ],
        photo: { src: '/images/user/IMG_0843.jpeg', alt: 'ねこカフェ' }
      },
      {
        id: 'fd-20241030-episode-ramen',
        type: 'episode',
        title: '我ガのラーメンでお水をこぼしそうに',
        artKey: 'night-sky-market',
        text: ['空港まで見送ってもらって、ぎゅーした。'],
        photo: { src: '/images/user/IMG_0870.jpeg', alt: 'ラーメン' }
      },
      {
        id: 'fd-20241030-q-after-feel',
        type: 'question',
        style: 'text',
        prompt: '初めてのデートを終えての感想は？',
        storageKey: 'fd-20241030-after-feel',
        readonlyAfterSave: true,
        placeholder: '素直な気持ちを書いてね'
      },
      {
        id: 'fd-20241030-flight-fuk-nrt',
        type: 'move',
        mode: 'flight',
        from: '福岡',
        to: '成田／家',
        distanceKm: 1216,
        artKey: 'night-sky-market'
      }
    ]
  },

  // === 初めてのクリスマス（小倉） 2024-12-23〜26 ===
  {
    id: 'xmas-2024-12-23',
    title: '初めてのクリスマス（移動日）',
    date: '2024-12-23',
    steps: [
      {
        id: 'xmas-20241223-bus-home-yaesu-kokura',
        type: 'move',
        mode: 'bus',
        from: '家',
        to: '東京ミッドタウン八重洲→小倉駅',
        distanceKm: 1339,
        artKey: 'christmas-town',
        description: '夜行バスで小倉へ'
      }
    ]
  },
  {
    id: 'xmas-2024-12-24',
    title: '小倉で再会＆クリスマスマーケット',
    date: '2024-12-24',
    steps: [
      {
        id: 'xmas-20241224-episode-reunion',
        type: 'episode',
        title: '小倉駅で再会→荷物をロッカーへ',
        artKey: 'christmas-town',
        text: ['あやねの生まれ育った街に来られて嬉しい。'],
        photo: { src: '/images/user/IMG_1220.jpeg', alt: '小倉駅で再会' }
      },
      {
        id: 'xmas-20241224-quiz-lunch',
        type: 'question',
        style: 'choice',
        prompt: '小倉最初のご飯は何を食べた？',
        storageKey: 'xmas-20241224-lunch',
        choices: ['ローストビーフ丼', 'ラーメン', 'クリームパスタ', 'くら寿司'],
        correctAnswer: 'ローストビーフ丼',
        readonlyAfterSave: true
      },
      {
        id: 'xmas-20241224-episode-lunch-parade',
        type: 'episode',
        title: 'ローストビーフ丼→アニメイト→ホテル',
        artKey: 'christmas-town',
        text: ['ホテルへチェックインして少し休憩。'],
        photo: { src: '/images/user/IMG_1230.jpeg', alt: 'ホテル' }
      },
      {
        id: 'xmas-20241224-episode-market',
        type: 'episode',
        title: '夜のクリスマスマーケット',
        artKey: 'christmas-town',
        text: [
          '大道芸とイルミネーションの橋。ビーフシチューを購入。人混みで少し離れた所で食べる。',
          'セブンで揚げどり・お酒・ケーキ。取り分けに失敗も楽しい思い出。'
        ],
        photo: { src: '/images/user/IMG_1261.jpeg', alt: 'クリスマスマーケット' }
      },
      {
        id: 'xmas-20241224-q-night-feel',
        type: 'question',
        style: 'text',
        prompt: 'クリスマスの夜の感想は？',
        storageKey: 'xmas-20241224-night-feel',
        readonlyAfterSave: true
      }
    ]
  },
  {
    id: 'xmas-2024-12-25',
    title: '博多＆天神めぐり',
    date: '2024-12-25',
    steps: [
      {
        id: 'xmas-20241225-move-kokura-hakata',
        type: 'move',
        mode: 'train',
        from: '小倉',
        to: '博多',
        distanceKm: 80,
        artKey: 'christmas-town',
        description: 'のんびりしてから新幹線で博多へ'
      },
      {
        id: 'xmas-20241225-episode-pokemon',
        type: 'episode',
        title: 'ポケモンセンターでヒスイゾロア',
        artKey: 'christmas-town',
        text: ['空フェス夜市でプレゼント探し、豚骨ラーメンも。'],
        photo: { src: '/images/user/IMG_1295.jpeg', alt: 'ポケセン' }
      },
      {
        id: 'xmas-20241225-episode-tenjin',
        type: 'episode',
        title: '天神のクリスマスマーケットは大混雑',
        artKey: 'christmas-town',
        text: ['人が多すぎて撤退→博多→小倉へ戻る。'],
        photo: { src: '/images/user/IMG_1334.jpeg', alt: '天神の人混み' }
      },
      {
        id: 'xmas-20241225-q-thisyear',
        type: 'question',
        style: 'text',
        prompt: '今年のクリスマスはどうしたい？',
        storageKey: 'xmas-20241225-plan',
        readonlyAfterSave: true
      },
      {
        id: 'xmas-20241225-move-hakata-kokura',
        type: 'move',
        mode: 'train',
        from: '博多',
        to: '小倉',
        distanceKm: 80,
        artKey: 'christmas-town'
      }
    ]
  },
  {
    id: 'xmas-2024-12-26',
    title: '小倉で締め＆夜行バスで帰宅',
    date: '2024-12-26',
    steps: [
      {
        id: 'xmas-20241226-episode-lunch',
        type: 'episode',
        title: 'サカナノセカイでロマンチックなお昼',
        artKey: 'christmas-town',
        text: ['映画「聖おにいさん」、夜はサイゼリヤで間違い探し。'],
        photo: { src: '/images/user/IMG_1395.jpeg', alt: 'サカナノセカイ' }
      },
      {
        id: 'xmas-20241226-q-next-shop',
        type: 'question',
        style: 'text',
        prompt: '次に小倉で二人で行きたいお店は？',
        storageKey: 'xmas-20241226-next-shop',
        readonlyAfterSave: true
      },
      {
        id: 'xmas-20241226-bus-kokura-shinjuku-home',
        type: 'move',
        mode: 'bus',
        from: '小倉',
        to: 'バスタ新宿→家',
        distanceKm: 1318,
        artKey: 'christmas-town',
        description: '夜行バスで帰宅'
      }
    ]
  },

  // === あやねの京都卒業旅行 2025-02-25〜27 ===
  {
    id: 'kyoto-2025-02-25',
    title: '京都卒業旅行（初日）',
    date: '2025-02-25',
    steps: [
      {
        id: 'kyoto-20250225-bus-outbound',
        type: 'move',
        mode: 'bus',
        from: '家',
        to: 'バスタ新宿→京都駅',
        distanceKm: 491,
        artKey: 'kyoto-gold',
        description: '先に到着。京大の立て看も観に行った。'
      },
      {
        id: 'kyoto-20250225-episode-kinkaku',
        type: 'episode',
        title: '京都駅でお迎え→金閣寺へ',
        artKey: 'kyoto-gold',
        text: ['何度来ても京都は良い。決めカットもばっちり。'],
        photo: { src: '/images/user/IMG_2707.jpeg', alt: '金閣寺' }
      },
      {
        id: 'kyoto-20250225-episode-yamaneko',
        type: 'episode',
        title: '山猫軒でランチ（注文の多い料理店）',
        artKey: 'kyoto-gold',
        text: ['彩音にぴったりのお店に偶然出会えてラッキー！'],
        photo: { src: '/images/user/IMG_2727.jpeg', alt: '山猫軒' }
      },
      {
        id: 'kyoto-20250225-quiz-next-temple',
        type: 'question',
        style: 'choice',
        prompt: '次に向かったお寺は？',
        storageKey: 'kyoto-20250225-next-temple',
        choices: ['銀閣寺', '龍安寺', '伏見稲荷', '平安神宮'],
        correctAnswer: '龍安寺',
        readonlyAfterSave: true
      },
      {
        id: 'kyoto-20250225-episode-ryoanji',
        type: 'episode',
        title: '龍安寺の特別拝観',
        artKey: 'kyoto-gold',
        text: ['ガイドさんと長話でハラハラ。宿は最高。プレゼント交換も！'],
        photo: { src: '/images/user/IMG_2773.jpeg', alt: '宿' }
      },
      {
        id: 'kyoto-20250225-q-present',
        type: 'question',
        style: 'text',
        prompt: 'プレゼント交換後の気持ちは？',
        storageKey: 'kyoto-20250225-present-feel',
        readonlyAfterSave: true
      },
      {
        id: 'kyoto-20250225-episode-ramen',
        type: 'episode',
        title: '浴衣でラーメン屋さんへ',
        artKey: 'kyoto-gold',
        text: ['夜の京都も満喫。'],
        photo: { src: '/images/user/IMG_2812.jpeg', alt: '京都の夜ごはん' }
      }
    ]
  },
  {
    id: 'kyoto-2025-02-26',
    title: '任天堂ミュージアムで大はしゃぎ',
    date: '2025-02-26',
    steps: [
      {
        id: 'kyoto-20250226-episode-museum-enter',
        type: 'episode',
        title: 'お揃いのネッシー帽→任天堂ミュージアム',
        artKey: 'kyoto-gold',
        text: ['早めに到着して少し待つ。中に入ってお昼ごはん。'],
        photo: { src: '/images/user/IMG_2851.jpeg', alt: 'ミュージアム内' }
      },
      {
        id: 'kyoto-20250226-q-game-now',
        type: 'question',
        style: 'text',
        prompt: '今一番遊びたいニンテンドーのゲームは？',
        storageKey: 'kyoto-20250226-game-now',
        readonlyAfterSave: true
      },
      {
        id: 'kyoto-20250226-episode-games',
        type: 'episode',
        title: 'ゲームコーナーで対戦・ラブテスターも',
        artKey: 'kyoto-gold',
        text: [
          '10コインで好きなゲームを遊ぶ。二人ともFPSゲーマーで1位2位フィニッシュ！',
          '巨大コントローラー、最後はアイス積みも。'
        ],
        photo: { src: '/images/user/IMG_2939.jpeg', alt: 'ゲーム体験' }
      },
      {
        id: 'kyoto-20250226-quiz-love-tester',
        type: 'question',
        style: 'choice',
        prompt: '二人の最終的なラブ度は？',
        storageKey: 'kyoto-20250226-love-tester',
        choices: ['105', '95', '100', '115'],
        correctAnswer: '115',
        readonlyAfterSave: true
      }
    ]
  },
  {
    id: 'kyoto-2025-02-27',
    title: '水族館→銀閣寺→京都タワー→帰路',
    date: '2025-02-27',
    steps: [
      {
        id: 'kyoto-20250227-episode-aquarium',
        type: 'episode',
        title: '京都水族館でのんびり',
        artKey: 'kyoto-gold',
        text: [
          'アザラシ・クラゲ・ツーショットたくさん。',
          'オオサンショウウオコインもゲット。'
        ],
        photo: { src: '/images/user/IMG_3021.jpeg', alt: '水族館' }
      },
      {
        id: 'kyoto-20250227-episode-lunch-pickles',
        type: 'episode',
        title: '和食ランチと漬物食べ放題',
        artKey: 'kyoto-gold',
        text: ['幸せ。'],
        photo: { src: '/images/user/IMG_3137.jpeg', alt: '和食ランチ' }
      },
      {
        id: 'kyoto-20250227-episode-ginkakuji',
        type: 'episode',
        title: '銀閣寺→期間限定の展覧会',
        artKey: 'kyoto-gold',
        text: ['人は多いが、きれいな作品に満たされる。'],
        photo: { src: '/images/user/IMG_3172.jpeg', alt: '展覧会' }
      },
      {
        id: 'kyoto-20250227-q-missed-train',
        type: 'question',
        style: 'text',
        prompt: '電車に間に合わなかった時の気持ちは？',
        storageKey: 'kyoto-20250227-missed-train',
        readonlyAfterSave: true
      },
      {
        id: 'kyoto-20250227-bus-back',
        type: 'move',
        mode: 'bus',
        from: '京都駅',
        to: 'バスタ新宿→家',
        distanceKm: 491,
        artKey: 'kyoto-gold',
        description: '京都タワーの夜景を見てから帰路へ'
      }
    ]
  }
]


export const journeys: Journey[] = newJourneyDefinitions.map((journey: JourneyInput) => {
  const distanceKm = journey.steps.reduce((total: number, step: Journey['steps'][number]) => {
    const maybeDistance = (step as { distanceKm?: number }).distanceKm
    const stepDistance = typeof maybeDistance === 'number' ? maybeDistance : 0
    return total + stepDistance
  }, 0)

  return {
    ...journey,
    distanceKm,
  }
})
