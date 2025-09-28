import type { Journey } from '../types/journey'

type JourneyInput = Omit<Journey, 'distanceKm'>

const newJourneyDefinitions: JourneyInput[] = [
  {
    id: 'journey-20241029',
    title: '旅ログ 2024-10-29',
    date: '2024-10-29',
    steps: [
      {
        id: 'journey-20241029-move-001',
        type: 'move',
        mode: 'flight',
        from: '家',
        to: '成田→福岡',
        distanceKm: 1216,
        description: '移動：飛行機　家→成田→福岡　（1,216km）',
      },
      {
        id: 'journey-20241029-episode-002',
        type: 'episode',
        text: [
          '空港のロビーで初めて出会う！',
          'あやねは恥ずかしがり屋さん。',
          '目を合わせてくれなかった！',
          '本を3冊くらい持ってきてた。',
        ],
        photo: {
          src: '/images/user/IMG_0642.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241029-question-004',
        type: 'question',
        style: 'text',
        prompt: '初めての第一印象は？',
        storageKey: 'journey-20241029-q-004',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20241029-episode-005',
        type: 'episode',
        text: [
          '博多駅からホテルまで歩いた。',
          'スーツケース持ってあげたいけど言い出せなかった記憶あり。',
          'ホテルは狭かったけども変なホテルじゃなくて良かった。',
          'ハロウィン仕様が可愛かったね。',
        ],
        photo: {
          src: '/images/user/IMG_0652.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241029-question-007',
        type: 'question',
        style: 'choice',
        prompt: '初めて二人で酔ったコンビニは？',
        storageKey: 'journey-20241029-q-007',
        choices: [
          '1,セブンイレブン',
          '2,ファミリーマート',
          '3,ローソン',
          '4,ミニストップ',
        ],
        correctAnswer: '１のセブンイレブン',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20241029-episode-008',
        type: 'episode',
        text: [
          '初めての2人で夜ご飯！',
          '隣のセブンイレブンで買ってきた。',
          '何を買ったか忘れたけど、匂いが気にならないのをチョイスしたが、あやねが坦々麺をしっかりスープまで飲んでたのを思い出した。',
          'そういうところが可愛いってなった！',
          '寝る頃にはもう夜が明けていた！',
        ],
      },
    ],
  },
  {
    id: 'journey-20241030',
    title: '旅ログ 2024-10-30',
    date: '2024-10-30',
    steps: [
      {
        id: 'journey-20241030-episode-001',
        type: 'episode',
        text: [
          '2人とも寝坊してレイトチェックアウトになった。',
          'カービーカフェの時間ギリギリで2人とも激焦りなのだった。',
          'この時のエスカレーターで撮ったあやねが最初の写真である。',
        ],
        photo: {
          src: '/images/user/IMG_0660.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241030-episode-003',
        type: 'episode',
        text: [
          'カービーカフェぎりぎり間に合った！',
          'あやねご満悦。',
          'いっぱい内装の写真を撮った。',
          'ローストビーフ丼のソースをかけずに完食してしまったあやね。',
        ],
        photo: {
          src: '/images/user/IMG_0717.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241030-episode-005',
        type: 'episode',
        text: [
          'キャナルシティでウィンドウショッピング。',
          '無印良品でクッションを抱っこする。',
          '可愛い。',
        ],
        photo: {
          src: '/images/user/IMG_0738.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241030-episode-007',
        type: 'episode',
        text: [
          '予定の猫カフェに行った！',
          '店内貸切だったぞ。',
          'あやねとねこどっちも可愛いかった！',
        ],
        photo: {
          src: '/images/user/IMG_0843.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241030-episode-009',
        type: 'episode',
        text: [
          'PARCOなど、色んなお店を見て回った！',
          '彩音の服を買うミッションがあったが失敗…',
        ],
        photo: {
          src: '/images/user/IMG_0865.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241030-episode-011',
        type: 'episode',
        text: [
          'ラーメン屋の我ガでラーメン。',
          'お水をこぼして泣きそうになる。',
        ],
        photo: {
          src: '/images/user/IMG_0870.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241030-image-013',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_0872.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20241030-episode-014',
        type: 'episode',
        text: [
          '空港まで見送ってくれたのを覚えてる！',
          'ぎゅーした！',
        ],
      },
      {
        id: 'journey-20241030-question-015',
        type: 'question',
        style: 'text',
        prompt: '初めてのデートを終えての感想は？',
        storageKey: 'journey-20241030-q-015',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20241030-move-016',
        type: 'move',
        mode: 'flight',
        from: '福岡',
        to: '成田→家',
        distanceKm: 1216,
        description: '移動：飛行機　福岡→成田→家（ 1,216km）',
      },
      {
        id: 'journey-20241030-episode-017',
        type: 'episode',
        text: [
          '#初めてのクリスマス',
        ],
      },
    ],
  },
  {
    id: 'journey-20241223',
    title: '旅ログ 2024-12-23',
    date: '2024-12-23',
    steps: [
      {
        id: 'journey-20241223-move-001',
        type: 'move',
        mode: 'bus',
        from: '家',
        to: '東京ミッドタウン八重洲→小倉駅',
        distanceKm: 1339,
        description: '移動：バス　家→東京ミッドタウン八重洲→小倉駅　 （1,339km）',
      },
    ],
  },
  {
    id: 'journey-20241224',
    title: '旅ログ 2024-12-24',
    date: '2024-12-24',
    steps: [
      {
        id: 'journey-20241224-episode-001',
        type: 'episode',
        text: [
          '小倉駅で再会〜！',
          'あやねの生まれ育った街の来れて嬉しかったのだ。',
          '荷物をロッカーに。',
        ],
        photo: {
          src: '/images/user/IMG_1220.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241224-episode-003',
        type: 'episode',
        text: [
          '魚町商店街のお店で美味しいランチ。',
        ],
        photo: {
          src: '/images/user/IMG_1223.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241224-question-004',
        type: 'question',
        style: 'choice',
        prompt: '小倉最初のご飯は何を食べた？',
        storageKey: 'journey-20241224-q-004',
        choices: [
          '1,ローストビーフ丼',
          '2,ラーメン',
          '3,クリームパスタ',
          '4,くら寿司',
        ],
        correctAnswer: '1,ローストビーフ丼',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20241224-episode-005',
        type: 'episode',
        text: [
          'ここであやねはローストビーフ丼、僕はステーキ丼。',
          'パイナップルジュース美味しかった',
        ],
        photo: {
          src: '/images/user/IMG_1226.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241224-episode-008',
        type: 'episode',
        text: [
          'その後、アニメイトに行きたいということで、アニメイトへ。',
          'あやね、漫画を購入。',
        ],
      },
      {
        id: 'journey-20241224-episode-009',
        type: 'episode',
        text: [
          'どこか行きたいみたいなのと迷ってた気がするが、ホテルで休みたすぎるとのことでホテルにチェックイン。',
        ],
        photo: {
          src: '/images/user/IMG_1230.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241224-episode-011',
        type: 'episode',
        text: [
          'ホテルで休憩の後、確か井筒屋にケーキを買いに行ったんだった気がする。',
          '営業前のクリスマスマーケットも少し覗く。',
        ],
        photo: {
          src: '/images/user/IMG_1273.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241224-episode-013',
        type: 'episode',
        text: [
          'ホテルで休憩のち、夜のクリスマスマーケットへ。',
          '大道芸を見て、イルミネーションの橋を渡って、ビーフシチューを購入。',
          'あやね人酔いのため少ないところで食べる',
        ],
        photo: {
          src: '/images/user/IMG_1246.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241224-image-015',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_1261.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20241224-image-016',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_1268.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20241224-episode-017',
        type: 'episode',
        text: [
          '2人でセブンに寄って、揚げどりとお酒とケーキ。',
          'クリスマス飯。',
          'あやねがケーキの取り分けに失敗。',
        ],
        photo: {
          src: '/images/user/IMG_1270.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241224-image-019',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_1279.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20241224-question-020',
        type: 'question',
        style: 'text',
        prompt: 'クリスマスの夜の感想は？',
        storageKey: 'journey-20241224-q-020',
        readonlyAfterSave: true,
      },
    ],
  },
  {
    id: 'journey-20241225',
    title: '旅ログ 2024-12-25',
    date: '2024-12-25',
    steps: [
      {
        id: 'journey-20241225-episode-001',
        type: 'episode',
        text: [
          '2日目は2時までホテルでのんびり。',
        ],
      },
      {
        id: 'journey-20241225-move-002',
        type: 'move',
        mode: 'train',
        from: '小倉駅',
        to: '博多駅',
        distanceKm: 80,
        description: '移動：新幹線　小倉駅→博多駅 (80km)',
      },
      {
        id: 'journey-20241225-episode-003',
        type: 'episode',
        text: [
          'ポケモンセンターでヒスイゾロア購入',
        ],
        photo: {
          src: '/images/user/IMG_1295.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241225-episode-005',
        type: 'episode',
        text: [
          '空フェス夜市にてお互いプレゼントを探す',
        ],
        photo: {
          src: '/images/user/IMG_1303.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241225-episode-007',
        type: 'episode',
        text: [
          'あやねはお腹が空いていた。',
          '博多駅内の豚骨ラーメンを食す。',
        ],
        photo: {
          src: '/images/user/IMG_1313.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241225-episode-009',
        type: 'episode',
        text: [
          '天神のクリスマスマーケットに行くために天神へ移動。',
          'あやね、人が多すぎて死亡。',
        ],
        photo: {
          src: '/images/user/IMG_1334.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241225-episode-011',
        type: 'episode',
        text: [
          '博多に戻って、博多のクリスマスマーケットも人が多すぎることを確認。',
          '小倉に帰る。',
        ],
      },
      {
        id: 'journey-20241225-question-012',
        type: 'question',
        style: 'text',
        prompt: '今年のクリスマスはどうしたい？',
        storageKey: 'journey-20241225-q-012',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20241225-move-013',
        type: 'move',
        mode: 'train',
        from: '博多駅',
        to: '小倉駅',
        distanceKm: 80,
        description: '移動：新幹線　博多駅→小倉駅　(80km)',
      },
    ],
  },
  {
    id: 'journey-20241226',
    title: '旅ログ 2024-12-26',
    date: '2024-12-26',
    steps: [
      {
        id: 'journey-20241226-episode-001',
        type: 'episode',
        text: [
          'チェックアウトギリギリまでのんびり。',
          '小倉駅に荷物を置きに。',
          'ちいかわポップアップストア、駅ビルをウィンドウショッピング',
        ],
        photo: {
          src: '/images/user/IMG_1351.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241226-episode-003',
        type: 'episode',
        text: [
          '彩音が予約してくれてたサカナノセカイでお昼ご飯。',
          'ロマンチックだし、美味しくて可愛かった！',
        ],
        photo: {
          src: '/images/user/IMG_1395.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241226-image-005',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_1367.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20241226-image-006',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_1390.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20241226-episode-007',
        type: 'episode',
        text: [
          'ウィンドウショッピングをした気がする。',
          'その後、彩音の見たかった聖お兄さんを見た！',
          '佐藤二朗がよかったの同意！',
        ],
        photo: {
          src: '/images/user/IMG_1407.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241226-episode-009',
        type: 'episode',
        text: [
          '夜ご飯はサイゼリヤ！',
          'サイゼリヤといえば間違い探し。',
          '真剣に取り組むあやねん',
        ],
        photo: {
          src: '/images/user/IMG_1417.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20241226-question-011',
        type: 'question',
        style: 'text',
        prompt: '次小倉で二人で行きたいお店は？',
        storageKey: 'journey-20241226-q-011',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20241226-episode-012',
        type: 'episode',
        text: [
          'リーガロイヤルの前でお別れし、夜行バス帰宅！',
        ],
      },
      {
        id: 'journey-20241226-move-013',
        type: 'move',
        mode: 'bus',
        from: '小倉駅',
        to: 'バスタ新宿→家',
        distanceKm: 1318,
        description: '移動：バス　小倉駅→バスタ新宿→家　(1,318km)',
      },
      {
        id: 'journey-20241226-episode-014',
        type: 'episode',
        text: [
          '#あやねの京都卒業旅行',
        ],
      },
    ],
  },
  {
    id: 'journey-20250225',
    title: '旅ログ 2025-02-25',
    date: '2025-02-25',
    steps: [
      {
        id: 'journey-20250225-move-001',
        type: 'move',
        mode: 'bus',
        from: '家',
        to: 'バスタ新宿→京都駅',
        distanceKm: 0,
        description: '移動：バス　家→バスタ新宿→京都駅',
      },
      {
        id: 'journey-20250225-episode-002',
        type: 'episode',
        text: [
          '早く先に着いた。',
          '2/25といえば国立二次。',
          '恒例の京大立て看を観に行った。',
        ],
        photo: {
          src: '/images/user/IMG_2663.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-episode-004',
        type: 'episode',
        text: [
          'あやねを京都駅でお迎え！',
          'まずは金閣寺に行くことに。',
        ],
        photo: {
          src: '/images/user/IMG_2707.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-episode-006',
        type: 'episode',
        text: [
          'やはりいつ来ても京都はええやね〜',
        ],
        photo: {
          src: '/images/user/IMG_2711.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-episode-008',
        type: 'episode',
        text: [
          '金閣の前でこの画角！',
          '流石すぎる、、',
        ],
      },
      {
        id: 'journey-20250225-episode-009',
        type: 'episode',
        text: [
          'あやねはお腹が空いたと！',
          'なんと、次行く龍安寺の道に、彩音の好きな注文の多い料理店にでてくる山猫軒が！',
        ],
        photo: {
          src: '/images/user/IMG_2719.jpeg',
          alt: '何は心は意くにあります',
        },
      },
      {
        id: 'journey-20250225-episode-011',
        type: 'episode',
        text: [
          '偶然、彩音にぴったりのお店に出会えてとてもラッキーな気分！',
        ],
        photo: {
          src: '/images/user/IMG_2727.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-question-013',
        type: 'question',
        style: 'choice',
        prompt: '次に向かったお寺は？',
        storageKey: 'journey-20250225-q-013',
        choices: [
          '1,銀閣寺',
          '2,龍安寺',
          '3,伏見稲荷',
          '4,平安神宮',
        ],
        correctAnswer: '２の龍安寺',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250225-episode-014',
        type: 'episode',
        text: [
          '龍安寺は1番好きな寺で、世界遺産でもあるので見せたいなあと思ったのだ',
        ],
        photo: {
          src: '/images/user/IMG_2730.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-image-016',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_2731.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250225-episode-017',
        type: 'episode',
        text: [
          'ちょうど特別拝観で滅多に観られない龍安寺の奥へ。',
          'ガイドさんと長話をしてしまい、あやねが楽しくなくなってしまう！',
          'とゾクゾクしていた。',
        ],
        photo: {
          src: '/images/user/IMG_2737.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-episode-019',
        type: 'episode',
        text: [
          '疲れたので宿に行きたいと、宿に行くが鍵をもらうところがわからず少しウロウロ。',
          '宿は彩音が選んだが、最高であった！',
        ],
        photo: {
          src: '/images/user/IMG_2773.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-image-021',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_2749.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250225-episode-022',
        type: 'episode',
        text: [
          '早速プレゼント交換！',
          '札幌で手に入れたお揃いのネッシー帽(超激レア)をプレゼント。',
          'かなりご満悦！',
        ],
        photo: {
          src: '/images/user/IMG_2771.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-episode-024',
        type: 'episode',
        text: [
          'あやねはなんと沢山の誕生日プレゼント！',
          '誕生日はなかなか祝ってもらえないのでとても今までにない嬉しさだった、。',
        ],
        photo: {
          src: '/images/user/IMG_2794.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250225-question-026',
        type: 'question',
        style: 'text',
        prompt: 'プレゼント交換後の気持ちは？',
        storageKey: 'journey-20250225-q-026',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250225-episode-027',
        type: 'episode',
        text: [
          '夜ご飯は浴衣でラーメン屋さんへ。',
        ],
        photo: {
          src: '/images/user/IMG_2812.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250226',
    title: '旅ログ 2025-02-26',
    date: '2025-02-26',
    steps: [
      {
        id: 'journey-20250226-episode-001',
        type: 'episode',
        text: [
          'お揃いのネッシー帽を被って出発',
        ],
        photo: {
          src: '/images/user/IMG_2813.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-003',
        type: 'episode',
        text: [
          'ツーショットを取りたいのにこっちを見てくれないあやねん',
        ],
        photo: {
          src: '/images/user/IMG_2816.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-005',
        type: 'episode',
        text: [
          'あやね、念願の任天堂ミュージアム！',
          '！',
          '早めに到着してしまい、少し待った。',
        ],
        photo: {
          src: '/images/user/IMG_2823.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-007',
        type: 'episode',
        text: [
          '入って、早速お昼ご飯！',
          'あやねご機嫌。',
        ],
        photo: {
          src: '/images/user/IMG_2851.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-image-009',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_2859.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250226-episode-010',
        type: 'episode',
        text: [
          'カスタマイズできるハンバーガーでとてもおいしかった！',
        ],
        photo: {
          src: '/images/user/IMG_2872.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-012',
        type: 'episode',
        text: [
          '記念ツーショット',
        ],
      },
      {
        id: 'journey-20250226-episode-013',
        type: 'episode',
        text: [
          '任天堂がこれまで出してきたデバイスやゲームソフトがすべて展示されているエリアへ。',
          'あやね大興奮！',
          'あやねのプレイしたゲームやデバイスの話に花が咲く。',
        ],
      },
      {
        id: 'journey-20250226-question-014',
        type: 'question',
        style: 'text',
        prompt: '今一番遊びたいニンテンドーのゲームは？',
        storageKey: 'journey-20250226-q-014',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250226-episode-015',
        type: 'episode',
        text: [
          '続いてゲームコーナー10コインの手持ちを消費して好きなゲームを遊べた！',
        ],
        photo: {
          src: '/images/user/IMG_2890.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-017',
        type: 'episode',
        text: [
          'あやねとの相性チェック、ラブテスター！',
        ],
      },
      {
        id: 'journey-20250226-question-018',
        type: 'question',
        style: 'choice',
        prompt: '二人の最終的なラブ度は？',
        storageKey: 'journey-20250226-q-018',
        choices: [
          '1,105',
          '2,95',
          '3,100',
          '4,115',
        ],
        correctAnswer: '4,115',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250226-image-019',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/shooting.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250226-episode-020',
        type: 'episode',
        text: [
          '2人ともFPSゲーマーなのでザッパーandスコープ！',
          'なんと1位2位フィニッシュ！',
          '！',
        ],
        photo: {
          src: '/images/user/IMG_2939.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-022',
        type: 'episode',
        text: [
          'でっかいコントローラーでゲームを遊べた！',
          'あやね、しゅうくんの操作にちょい不満、。',
          'あやねはやっぱり負けず嫌いのよう。',
        ],
        photo: {
          src: '/images/user/IMG_2922.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-024',
        type: 'episode',
        text: [
          '最後は、簡単なアイスクリーム積み！',
          '宇宙まで届いて楽しかった！',
        ],
        photo: {
          src: '/images/user/IMG_2931.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-026',
        type: 'episode',
        text: [
          'さらば、Nintendoミュージアム。',
        ],
        photo: {
          src: '/images/user/IMG_2935.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-028',
        type: 'episode',
        text: [
          'まさかの帰りの駅が小倉駅。',
        ],
        photo: {
          src: '/images/user/IMG_2957.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-030',
        type: 'episode',
        text: [
          '夜ご飯は京都の焼き鳥チェーン店。',
          'あやねに',
          'ぐるぐる鶏皮の存在を教えてもらう。',
        ],
        photo: {
          src: '/images/user/IMG_2966.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250226-episode-032',
        type: 'episode',
        text: [
          'このケーキをどこで買ったのか覚えていない。',
          'ファミマでお酒を買ってきた。',
        ],
      },
    ],
  },
  {
    id: 'journey-20250227',
    title: '旅ログ 2025-02-27',
    date: '2025-02-27',
    steps: [
      {
        id: 'journey-20250227-image-001',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_2976.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250227-episode-002',
        type: 'episode',
        text: [
          '確かバスを間違えて、京都水族館に急遽行くことになった。',
        ],
        photo: {
          src: '/images/user/IMG_3004.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-image-004',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_3009.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250227-episode-005',
        type: 'episode',
        text: [
          'アザラシがゴロゴロしていて可愛かった！',
        ],
        photo: {
          src: '/images/user/IMG_3021.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-image-007',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_3031.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250227-episode-008',
        type: 'episode',
        text: [
          '帽子かぶったあやねがペンギンみたい。',
          'かわいい。',
        ],
        photo: {
          src: '/images/user/IMG_3048.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-010',
        type: 'episode',
        text: [
          'とにかくいっぱいきれいな写真が撮れた！',
        ],
        photo: {
          src: '/images/user/IMG_3061.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-012',
        type: 'episode',
        text: [
          'クラゲ可愛い',
        ],
        photo: {
          src: '/images/user/IMG_3090.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-014',
        type: 'episode',
        text: [
          '反射するところが多かったので、ツーショットいっぱい！',
        ],
        photo: {
          src: '/images/user/IMG_3105.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-016',
        type: 'episode',
        text: [
          'あやね、オオサンショウウオコインげっと！',
        ],
        photo: {
          src: '/images/user/IMG_3117.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-018',
        type: 'episode',
        text: [
          '京都駅にて和食が食べれるお店を探した。',
          'なんと漬物、食べ放題！',
          'しゅうくんはっぴー！',
        ],
        photo: {
          src: '/images/user/IMG_3137.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-020',
        type: 'episode',
        text: [
          'お昼の後は、銀閣寺。',
          'Nintendoミュージアムで出会った親子と偶然、再会！',
          '蛙の帽子のお兄さんとお姉さんと言われた。',
        ],
      },
      {
        id: 'journey-20250227-episode-021',
        type: 'episode',
        text: [
          '動物園などと迷ったが、期間限定の展覧会へ。',
        ],
        photo: {
          src: '/images/user/IMG_3141.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-image-023',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_3162.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250227-episode-024',
        type: 'episode',
        text: [
          '人が多かったけれど、きれいな作品を見れた！',
        ],
        photo: {
          src: '/images/user/IMG_3172.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-image-026',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_3175.jpeg',
          alt: '画像',
        },
      },
      {
        id: 'journey-20250227-episode-027',
        type: 'episode',
        text: [
          '彩音は、カメラに近づいてくるところ可愛くて大好き！',
        ],
        photo: {
          src: '/images/user/IMG_3176.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-029',
        type: 'episode',
        text: [
          '京都駅に戻り、夜ご飯はを食べたあやねん。',
          '確か、ここでお金が尽きた。',
        ],
        photo: {
          src: '/images/user/IMG_3178.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-031',
        type: 'episode',
        text: [
          '時間が余ったので、京都タワーへ登る。',
        ],
        photo: {
          src: '/images/user/IMG_3193.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250227-episode-033',
        type: 'episode',
        text: [
          '京都の夜景を見れた。',
          '時間が余ってると思いきや、電車の時刻を過ぎてしまい、激焦りのあやね',
          '急いで新幹線のチケットを買って難を凌いだ！',
        ],
      },
      {
        id: 'journey-20250227-question-034',
        type: 'question',
        style: 'text',
        prompt: '電車に間に合わなかった時の気持ちは？',
        storageKey: 'journey-20250227-q-034',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250227-move-035',
        type: 'move',
        mode: 'bus',
        from: '京都駅',
        to: 'バスタ新宿→家',
        distanceKm: 491,
        description: '移動：バス　京都駅→バスタ新宿→家　(491km)',
      },
      {
        id: 'journey-20250227-episode-036',
        type: 'episode',
        text: [
          '#',
        ],
      },
    ],
  },
  {
    id: 'journey-20250304',
    title: '旅ログ 2025-03-04',
    date: '2025-03-04',
    steps: [
      {
        id: 'journey-20250304-move-001',
        type: 'move',
        mode: 'flight',
        from: '家',
        to: '成田空港→福岡空港',
        distanceKm: 1261,
        description: '移動:飛行機　家→成田空港→福岡空港　(1261km)',
      },
      {
        id: 'journey-20250304-episode-002',
        type: 'episode',
        text: [
          'あやねのトムジェ展に着いていきたいとわがままを言ってしまったため、1ヶ月以内の再会。',
        ],
        photo: {
          src: '/images/user/IMG_3311.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-004',
        type: 'episode',
        text: [
          '博多駅の牛タン屋さん。',
          'あやねは薄い牛タンが好き。',
        ],
        photo: {
          src: '/images/user/IMG_3314.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-006',
        type: 'episode',
        text: [
          '大濠公園へ。',
          '大濠公園には沢山の鴨がいた！',
          '美術館が近づくにつれ楽しみが増していくあやねん',
        ],
        photo: {
          src: '/images/user/IMG_3335.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-008',
        type: 'episode',
        text: [
          '会場手前にガチャガチャが！',
          'テンションは初めからMAX！',
        ],
        photo: {
          src: '/images/user/IMG_3351.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-010',
        type: 'episode',
        text: [
          'あやねはどのシーンがどんな話なのかを沢山覚えている！',
          '沢山説明してくれた！',
        ],
        photo: {
          src: '/images/user/IMG_3366.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-012',
        type: 'episode',
        text: [
          'とにかくトムジェを語るのが楽しそう！',
        ],
        photo: {
          src: '/images/user/IMG_3399.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-014',
        type: 'episode',
        text: [
          'そして、この手から伝わる熱の入りよう',
        ],
        photo: {
          src: '/images/user/IMG_3402.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-016',
        type: 'episode',
        text: [
          '彩音じゃない写真も。',
        ],
        photo: {
          src: '/images/user/IMG_3413.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-018',
        type: 'episode',
        text: [
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_3425.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-020',
        type: 'episode',
        text: [
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_3472.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-022',
        type: 'episode',
        text: [
          '熱が入っている！',
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_3478.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-024',
        type: 'episode',
        text: [
          '身振り手振り！',
        ],
        photo: {
          src: '/images/user/IMG_3479.jpeg',
          alt: 'L#',
        },
      },
      {
        id: 'journey-20250304-episode-026',
        type: 'episode',
        text: [
          'チーズの穴から集合写真！',
        ],
        photo: {
          src: '/images/user/IMG_3495.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-028',
        type: 'episode',
        text: [
          'これもかわいい',
        ],
        photo: {
          src: '/images/user/IMG_3542.jpeg',
          alt: 'HELDNES',
        },
      },
      {
        id: 'journey-20250304-episode-030',
        type: 'episode',
        text: [
          '手の動きが速い！',
        ],
        photo: {
          src: '/images/user/IMG_3567.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-question-032',
        type: 'question',
        style: 'choice',
        prompt: 'トムジェカレンダー！あやねの誕生日の以下の作品のタイトルはどれ？',
        storageKey: 'journey-20250304-q-032',
        choices: [
          '1,道具に使われる2人',
          '2,作戦了解の合図',
          '3,ワゴンだって飛ぶんだぜ',
          '4,食事に向かってよーいどん',
        ],
        correctAnswer: '4,食事に向かってよーいどん',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250304-image-033',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_3585.jpeg',
          alt: '＃まさに居地的な表術',
        },
      },
      {
        id: 'journey-20250304-episode-034',
        type: 'episode',
        text: [
          '正解はこれ〜',
        ],
        photo: {
          src: '/images/user/IMG_3584.jpeg',
          alt: 'お食事にむかってよーいどん',
        },
      },
      {
        id: 'journey-20250304-question-036',
        type: 'question',
        style: 'choice',
        prompt: 'トムジェカレンダー！あやねの誕生日の以下の作品のタイトルはどれ？',
        storageKey: 'journey-20250304-q-036',
        choices: [
          '1,チーズをつまみ食い',
          '2,一緒には食べられないふたり',
          '3,お食事準備中',
          '4,ジェリーのレモン絞り',
        ],
        correctAnswer: '2,一緒には食べられないふたり',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250304-image-037',
        type: 'episode',
        text: [],
        photo: {
          src: '/images/user/IMG_3586.jpeg',
          alt: '＊しっぽをつかんでスヤスヤ',
        },
      },
      {
        id: 'journey-20250304-episode-038',
        type: 'episode',
        text: [
          '正解はこちら！',
        ],
        photo: {
          src: '/images/user/IMG_3587.jpeg',
          alt: 'RTELEGRAM',
        },
      },
      {
        id: 'journey-20250304-episode-040',
        type: 'episode',
        text: [
          'お土産屋さんには大量の限定グッズが！',
          '1時間くらいずっとお買い物した。',
        ],
        photo: {
          src: '/images/user/IMG_3620.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-question-042',
        type: 'question',
        style: 'text',
        prompt: 'トムジェ展はどうだった？',
        storageKey: 'journey-20250304-q-042',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250304-episode-043',
        type: 'episode',
        text: [
          'ウィンドウショッピングのち、天神の星乃珈琲でおやつ',
        ],
        photo: {
          src: '/images/user/IMG_3627.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-045',
        type: 'episode',
        text: [
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_3633.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-047',
        type: 'episode',
        text: [
          '初めてのラブホでうきうき！',
        ],
        photo: {
          src: '/images/user/IMG_3643.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250304-episode-049',
        type: 'episode',
        text: [
          '深夜にラーメンを食べにお散歩。',
          '猫カフェの近くで懐かしみがあった。',
        ],
        photo: {
          src: '/images/user/IMG_3663.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250305',
    title: '旅ログ 2025-03-05',
    date: '2025-03-05',
    steps: [
      {
        id: 'journey-20250305-episode-001',
        type: 'episode',
        text: [
          'トムジェ展のお土産で買ったしゅしゅをプレゼント！',
        ],
        photo: {
          src: '/images/user/IMG_3665.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-003',
        type: 'episode',
        text: [
          'この髪型が1番好きなのだ。',
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_3670.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-005',
        type: 'episode',
        text: [
          '前日の領収書を自慢げに見せるあやね氏',
        ],
        photo: {
          src: '/images/user/IMG_3695.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-007',
        type: 'episode',
        text: [
          '博多駅の屋上庭園へ。',
        ],
        photo: {
          src: '/images/user/IMG_3704.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-009',
        type: 'episode',
        text: [
          'これかわいい',
        ],
        photo: {
          src: '/images/user/IMG_3714.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-011',
        type: 'episode',
        text: [
          'レストランの階でトムジェダイナーを探す。',
          '壁にもトムジェだらけ！',
        ],
        photo: {
          src: '/images/user/IMG_3729.jpeg',
          alt: '2.10：-3.19：',
        },
      },
      {
        id: 'journey-20250305-episode-013',
        type: 'episode',
        text: [
          'トムジェダイナー到着！',
        ],
        photo: {
          src: '/images/user/IMG_3738.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-015',
        type: 'episode',
        text: [
          'このかわいいドリンク！',
          'すごくよかったなあ',
        ],
        photo: {
          src: '/images/user/IMG_3764.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-017',
        type: 'episode',
        text: [
          '清楚系大好きなのでこの服とあやねも大好き',
        ],
        photo: {
          src: '/images/user/IMG_3769.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-019',
        type: 'episode',
        text: [
          'ピザもかわいい！',
        ],
        photo: {
          src: '/images/user/IMG_3773.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-021',
        type: 'episode',
        text: [
          '阪急とアミュのガチャガチャを巡る',
        ],
        photo: {
          src: '/images/user/IMG_3798.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-023',
        type: 'episode',
        text: [
          'ポケモンセンターにてウィンドウショッピング',
        ],
        photo: {
          src: '/images/user/IMG_3802.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-025',
        type: 'episode',
        text: [
          'アミュのベンチで高額医療費制度について長時間話す。',
          'デートとしていかがなものか、この男…',
        ],
        photo: {
          src: '/images/user/IMG_3804.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-027',
        type: 'episode',
        text: [
          'やはり締めは焼き鳥である！',
          'ぼんじりとハムチーズと焼きおにぎりはマジでうまいことを学ぶ。',
        ],
        photo: {
          src: '/images/user/IMG_3818.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-episode-029',
        type: 'episode',
        text: [
          '駅にてトムジェ像を発見して駅で解散！',
        ],
        photo: {
          src: '/images/user/IMG_3820.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250305-move-031',
        type: 'move',
        mode: 'flight',
        from: '福岡空港',
        to: '成田空港→家',
        distanceKm: 1216,
        description: '移動:福岡空港→成田空港→家　（1,216km）',
      },
    ],
  },
  {
    id: 'journey-20250416',
    title: '旅ログ 2025-04-16',
    date: '2025-04-16',
    steps: [
      {
        id: 'journey-20250416-move-001',
        type: 'move',
        mode: 'flight',
        from: '家',
        to: '成田空港→福岡空港',
        distanceKm: 1216,
        description: '移動:飛行機 家→成田空港→福岡空港  （1,216km）',
      },
      {
        id: 'journey-20250416-episode-002',
        type: 'episode',
        text: [
          '本当に腕がちぎれるかと思った',
        ],
        photo: {
          src: '/images/user/IMG_4882.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250416-episode-004',
        type: 'episode',
        text: [
          'お仕事大変なのにお手紙置いてくれてて嬉しかったのだ！',
        ],
        photo: {
          src: '/images/user/IMG_4883.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250416-episode-006',
        type: 'episode',
        text: [
          'あやねをコスモスまでお迎え！',
          '一緒に帰り道を歩く。',
          'お仕事頑張ったねくら寿司！',
          'エビを大量に頼むのが流儀。',
        ],
        photo: {
          src: '/images/user/IMG_4890.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250416-episode-008',
        type: 'episode',
        text: [
          'iPhoneのメルカリ出品を手伝ってくれるメルカリのプロあやね',
        ],
        photo: {
          src: '/images/user/IMG_4898.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250416-episode-010',
        type: 'episode',
        text: [
          'あやねずクッキング！',
          '思いつきで買ったけど上手くいってよかったらしい！',
          'チョコバナナ最高！',
        ],
        photo: {
          src: '/images/user/IMG_4906.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250416-episode-012',
        type: 'episode',
        text: [
          '疲れてるからか隣でぐっすり。',
          'あやねはよこにあるものにすぐ抱きつく',
        ],
        photo: {
          src: '/images/user/IMG_4936.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250418',
    title: '旅ログ 2025-04-18',
    date: '2025-04-18',
    steps: [
      {
        id: 'journey-20250418-episode-001',
        type: 'episode',
        text: [
          'プレゼントしたエプロンをつけてくれた！',
          '果たして次はいつ見れるのだろうか…',
        ],
        photo: {
          src: '/images/user/IMG_4946.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-003',
        type: 'episode',
        text: [
          'この日はネモフィラが見たいというわがままを聞いてくれたのだ！',
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_4956.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-005',
        type: 'episode',
        text: [
          'まるでお花',
        ],
        photo: {
          src: '/images/user/IMG_5033.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-007',
        type: 'episode',
        text: [
          '世界一かわいい',
        ],
        photo: {
          src: '/images/user/IMG_5095.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-question-009',
        type: 'question',
        style: 'choice',
        prompt: 'ネモフィラの花言葉は？',
        storageKey: 'journey-20250418-q-009',
        choices: [
          '1,可憐',
          '2,どこでも成功',
          '3,あなたを許す',
          '4,** **清々しい心',
        ],
        correctAnswer: '全て正解',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250418-episode-010',
        type: 'episode',
        text: [
          'お昼ご飯を食べにフードコートへ。',
          'なにやら、昔ながらのピカチュウが！',
        ],
        photo: {
          src: '/images/user/IMG_5137.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-012',
        type: 'episode',
        text: [
          'この日はあやねのツイステの推しのラギー・ブッチの誕生日ということで、ガチャを引くようだ',
        ],
        photo: {
          src: '/images/user/IMG_5145.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-014',
        type: 'episode',
        text: [
          'なんと！',
          'すぐ引き当ててしまった！',
        ],
        photo: {
          src: '/images/user/IMG_5148.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-016',
        type: 'episode',
        text: [
          'とても嬉しそう',
        ],
        photo: {
          src: '/images/user/IMG_5163.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-018',
        type: 'episode',
        text: [
          'ご飯を食べ終わりを測ると、軽くなっていた！',
        ],
        photo: {
          src: '/images/user/IMG_5166.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-020',
        type: 'episode',
        text: [
          '何も決めずに博多に行くと、なんと文具女子博がやっていた！',
          '可愛い手紙などを購入。',
        ],
        photo: {
          src: '/images/user/IMG_5178.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-episode-022',
        type: 'episode',
        text: [
          'あやね初の一風堂。',
          '豚骨ラーメンならだいたい美味い。',
        ],
        photo: {
          src: '/images/user/IMG_5183.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250418-move-024',
        type: 'move',
        mode: 'flight',
        from: '福岡空港',
        to: '成田空港→家',
        distanceKm: 1216,
        description: '移動: 飛行機 福岡空港→成田空港→家  （1,216km）',
      },
    ],
  },
  {
    id: 'journey-20250512',
    title: '旅ログ 2025-05-12',
    date: '2025-05-12',
    steps: [
      {
        id: 'journey-20250512-episode-001',
        type: 'episode',
        text: [
          '天神で待ち合わせ。',
          '新しく出来たビルに行く前に隣のビルでローストビーフ丼',
        ],
        photo: {
          src: '/images/user/IMG_5642.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250512-episode-003',
        type: 'episode',
        text: [
          '謎の黄身だけ取り出す装置を初めて手にする彩音',
        ],
        photo: {
          src: '/images/user/IMG_5646.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250512-episode-005',
        type: 'episode',
        text: [
          'スヌーピーやちいかわのお店を見た。',
          'この日はあやね元気なかった…',
        ],
        photo: {
          src: '/images/user/IMG_5651.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250512-episode-007',
        type: 'episode',
        text: [
          'Oneビルは面白かったけど、あやねの好きな感じではなかった。',
          'アートはいい感じ。',
        ],
        photo: {
          src: '/images/user/IMG_5665.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250512-episode-009',
        type: 'episode',
        text: [
          '香椎に帰ってきて夜ご飯に初権兵衛！',
          'ぐるぐる鶏皮が美味すぎる。',
        ],
        photo: {
          src: '/images/user/IMG_5670.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250513',
    title: '旅ログ 2025-05-13',
    date: '2025-05-13',
    steps: [
      {
        id: 'journey-20250513-episode-001',
        type: 'episode',
        text: [
          'お仕事はお休み中。',
          'お昼からでもオーバーウォッチ！',
          'ゲームをして元気がでてた！',
          '嬉しいし、横から見てるのも楽しい。',
        ],
        photo: {
          src: '/images/user/IMG_5671.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250513-episode-003',
        type: 'episode',
        text: [
          'なんでかは忘れたが、外に出た。',
          'お買い物をしたはず。',
          'イオンかな？',
        ],
        photo: {
          src: '/images/user/IMG_5672.jpeg',
          alt: 'Dream Oaprule',
        },
      },
    ],
  },
  {
    id: 'journey-20250514',
    title: '旅ログ 2025-05-14',
    date: '2025-05-14',
    steps: [
      {
        id: 'journey-20250514-episode-001',
        type: 'episode',
        text: [
          'あやねの代わりにお使い。',
          '夜ご飯の材料を買ってきたと思う。',
          'あとミスドのサプライズを計画！',
        ],
        photo: {
          src: '/images/user/IMG_5679.jpeg',
          alt: 'PP ゆうちょ銀行',
        },
      },
      {
        id: 'journey-20250514-episode-003',
        type: 'episode',
        text: [
          'ミスドであやねもこの笑顔！',
        ],
        photo: {
          src: '/images/user/IMG_5694.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250515',
    title: '旅ログ 2025-05-15',
    date: '2025-05-15',
    steps: [
      {
        id: 'journey-20250515-episode-001',
        type: 'episode',
        text: [
          '八幡に行く前に動画編集。',
          'この時はClipcampやなあ。',
          '成長している！',
          '！',
        ],
        photo: {
          src: '/images/user/IMG_5699.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-003',
        type: 'episode',
        text: [
          'かわいいすぎる',
        ],
        photo: {
          src: '/images/user/IMG_5697.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-005',
        type: 'episode',
        text: [
          'ぼうしちょこんかわいい',
        ],
        photo: {
          src: '/images/user/IMG_5701.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-007',
        type: 'episode',
        text: [
          '八幡に到着。',
          'ビジュ◎',
        ],
        photo: {
          src: '/images/user/IMG_5705.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-010',
        type: 'episode',
        text: [
          'お目当てのグラニフ！',
          '！',
          'グラニフこんなにでかいの！',
          'とビックリしました。',
        ],
        photo: {
          src: '/images/user/IMG_5720.jpeg',
          alt: 'granjoh.',
        },
      },
      {
        id: 'journey-20250515-episode-011',
        type: 'episode',
        text: [
          'むふふんかわいい',
        ],
        photo: {
          src: '/images/user/IMG_5724.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-013',
        type: 'episode',
        text: [
          'もう一生試着してて欲しい',
        ],
        photo: {
          src: '/images/user/IMG_5734.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-015',
        type: 'episode',
        text: [
          '民族雑貨系にていい感じの帽子を見つける',
        ],
        photo: {
          src: '/images/user/IMG_5750.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-017',
        type: 'episode',
        text: [
          'フードコートに向かいつつ、ブランド物の話をした。',
        ],
        photo: {
          src: '/images/user/IMG_5759.jpeg',
          alt: 'M-PLAZA',
        },
      },
      {
        id: 'journey-20250515-episode-019',
        type: 'episode',
        text: [
          'フードコートでもぐるぐる鶏皮を食べる',
        ],
        photo: {
          src: '/images/user/IMG_5763.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-021',
        type: 'episode',
        text: [
          '焼きカレーは門司港の方が有名だと教えてもらった',
        ],
        photo: {
          src: '/images/user/IMG_5771.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-023',
        type: 'episode',
        text: [
          '念願のaxesfamだが、店員さんが付きっきりなのでまともに取れた写真これだけ。',
          'かわいい！',
        ],
        photo: {
          src: '/images/user/IMG_5779.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-question-025',
        type: 'question',
        style: 'text',
        prompt: '服を買うデートは好き？',
        storageKey: 'journey-20250515-q-025',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250515-episode-026',
        type: 'episode',
        text: [
          'クレープ屋さんでおやつ休憩',
        ],
        photo: {
          src: '/images/user/IMG_5789.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250515-episode-028',
        type: 'episode',
        text: [
          'あやねのバッグと靴を購入！',
          'いっぱい貢げてがちで幸せな滞在になったのだ！',
        ],
        photo: {
          src: '/images/user/IMG_5795.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250516',
    title: '旅ログ 2025-05-16',
    date: '2025-05-16',
    steps: [
      {
        id: 'journey-20250516-move-001',
        type: 'move',
        mode: 'flight',
        from: '福岡空港',
        to: '成田空港→家',
        distanceKm: 1216,
        description: '移動:飛行機  福岡空港→成田空港→家  （1,216km）',
      },
    ],
  },
  {
    id: 'journey-20250714',
    title: '旅ログ 2025-07-14',
    date: '2025-07-14',
    steps: [
      {
        id: 'journey-20250714-move-001',
        type: 'move',
        mode: 'flight',
        from: '家',
        to: '成田空港→福岡空港',
        distanceKm: 1216,
        description: '移動:飛行機 家→成田空港→福岡空港  （1,216km）',
      },
      {
        id: 'journey-20250714-episode-002',
        type: 'episode',
        text: [
          '早くついて暇つぶし。',
          'かわいいドンキとか新しいポケセンがあった。',
        ],
        photo: {
          src: '/images/user/IMG_9049.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250714-episode-004',
        type: 'episode',
        text: [
          'もうもはや我々と言えば鶏皮、鶏皮と言えば我々なのだ。',
        ],
        photo: {
          src: '/images/user/IMG_9055.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250714-episode-006',
        type: 'episode',
        text: [
          'あやねはローストビーフに取り憑かれているのかもしれない',
        ],
        photo: {
          src: '/images/user/IMG_9063.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250714-episode-008',
        type: 'episode',
        text: [
          '万博のお土産プレゼント！',
          'もうちょっとお土産あげられればなあ。',
        ],
        photo: {
          src: '/images/user/IMG_9068.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250714-episode-010',
        type: 'episode',
        text: [
          'ハリーポッター！',
          '2人で衣装を見るなどした。',
          '彩音にぜひ着て欲しい。',
        ],
        photo: {
          src: '/images/user/IMG_9072.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250714-episode-012',
        type: 'episode',
        text: [
          'ホテルまで遠すぎて死にそうなあやね',
        ],
        photo: {
          src: '/images/user/IMG_9075.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250714-episode-014',
        type: 'episode',
        text: [
          'ホテルのクオリティが高くてご満悦！',
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_9087.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250714-episode-016',
        type: 'episode',
        text: [
          'あやねにピザ買ってきて〜と言われたので妥協せず30分歩いてドミノピザへ。',
          'びっくりあやねん！',
        ],
        photo: {
          src: '/images/user/IMG_9090.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250715',
    title: '旅ログ 2025-07-15',
    date: '2025-07-15',
    steps: [
      {
        id: 'journey-20250715-episode-001',
        type: 'episode',
        text: [
          'ご覧の通り、ラブホ飯はかなりありということがわかったのだった。',
        ],
        photo: {
          src: '/images/user/IMG_9097.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-003',
        type: 'episode',
        text: [
          '前髪が長くて隠れるの可愛い好き',
        ],
        photo: {
          src: '/images/user/IMG_9110.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-005',
        type: 'episode',
        text: [
          '海を見に百道浜へー！',
        ],
        photo: {
          src: '/images/user/IMG_9112.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-007',
        type: 'episode',
        text: [
          '祝！',
          'スタバ童貞卒業！',
          'あやねの初めて貰っちゃった♡',
        ],
        photo: {
          src: '/images/user/IMG_9126.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-question-009',
        type: 'question',
        style: 'text',
        prompt: 'スタバ初体験の感想は？',
        storageKey: 'journey-20250715-q-009',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250715-episode-010',
        type: 'episode',
        text: [
          'ペイペイドームの横のチームラボフォレスト！',
          '頑張って生き物の捕獲をするあやね',
        ],
        photo: {
          src: '/images/user/IMG_9139.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-012',
        type: 'episode',
        text: [
          '思ってたより楽しんでくれてたように見えた！',
        ],
        photo: {
          src: '/images/user/IMG_9154.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-014',
        type: 'episode',
        text: [
          '壁を触ると蝶が落ちていくデジタルアート',
        ],
        photo: {
          src: '/images/user/IMG_9209.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-016',
        type: 'episode',
        text: [
          '綱渡りするあやね、かわいい！',
        ],
        photo: {
          src: '/images/user/IMG_9223.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-018',
        type: 'episode',
        text: [
          'あやねから虫歯ポーズを教えてもらった！',
        ],
        photo: {
          src: '/images/user/IMG_9282.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-020',
        type: 'episode',
        text: [
          'かわいい！',
          '！',
          'すぎる！',
          '！',
        ],
        photo: {
          src: '/images/user/IMG_9297.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-question-022',
        type: 'question',
        style: 'choice',
        prompt: 'あやねが創ったオオサンショウウオの名前は？',
        storageKey: 'journey-20250715-q-022',
        choices: [
          '1,スーパーオオサンショウウオ',
          '2,ハイパーオオサンショウウオ',
          '3,ビックオオサンショウウオ',
          '4,メガオオサンショウウオ',
        ],
        correctAnswer: '',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250715-episode-023',
        type: 'episode',
        text: [
          'A,1,スーパーオオサンショウウオ',
        ],
        photo: {
          src: '/images/user/IMG_9331.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-025',
        type: 'episode',
        text: [
          'スーパーオオサンショウウオ！',
          'かわいい！',
        ],
        photo: {
          src: '/images/user/IMG_9331.jpeg',
          alt: 'ペーパーサンショウワス',
        },
      },
      {
        id: 'journey-20250715-episode-027',
        type: 'episode',
        text: [
          '大変なのに海までついてきてくれたあやね！',
          '優しい好き',
        ],
        photo: {
          src: '/images/user/IMG_9346.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-029',
        type: 'episode',
        text: [
          '福岡の海はとてもいい！',
        ],
        photo: {
          src: '/images/user/IMG_9351.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250715-episode-031',
        type: 'episode',
        text: [
          'あやね疲れすぎて近くのホテルへ。',
          'らぶほよりも高くてらぶほよりダメだったけど、ほっともっとが美味かった。',
        ],
        photo: {
          src: '/images/user/IMG_9401.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250716',
    title: '旅ログ 2025-07-16',
    date: '2025-07-16',
    steps: [
      {
        id: 'journey-20250716-episode-001',
        type: 'episode',
        text: [
          '百道浜から博多に帰り、まずラーメン。',
          'メガネ外して肩出しがおとななあやねんすぎて終始興奮が止まらない。',
        ],
        photo: {
          src: '/images/user/IMG_9414.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-003',
        type: 'episode',
        text: [
          '楽しみだった動く浮世絵！',
          'めっちゃ綺麗だった！',
        ],
        photo: {
          src: '/images/user/IMG_9422.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-005',
        type: 'episode',
        text: [
          '浮世絵もあやねんも見れて眼福！',
        ],
        photo: {
          src: '/images/user/IMG_9448.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-007',
        type: 'episode',
        text: [
          '好き',
        ],
        photo: {
          src: '/images/user/IMG_9466.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-009',
        type: 'episode',
        text: [
          'にゃ〜',
        ],
        photo: {
          src: '/images/user/IMG_9478.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-011',
        type: 'episode',
        text: [
          '真似をするあやね！',
          '躍動感！',
          '！',
          '手の真似が上手い！',
        ],
        photo: {
          src: '/images/user/IMG_9508.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-013',
        type: 'episode',
        text: [
          '最後のエリアでツーショット！',
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_9542.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-015',
        type: 'episode',
        text: [
          '笑顔が素敵すぎるう',
        ],
        photo: {
          src: '/images/user/IMG_9550.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-017',
        type: 'episode',
        text: [
          'リニューアルされたポケセンへ！',
        ],
        photo: {
          src: '/images/user/IMG_9561.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-019',
        type: 'episode',
        text: [
          'アローラロコンにキュンキュン',
        ],
        photo: {
          src: '/images/user/IMG_9565.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-021',
        type: 'episode',
        text: [
          '星乃珈琲で暇つぶし！',
        ],
        photo: {
          src: '/images/user/IMG_9577.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-episode-023',
        type: 'episode',
        text: [
          'かなり暇つぶし！',
        ],
        photo: {
          src: '/images/user/IMG_9585.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250716-question-025',
        type: 'question',
        style: 'text',
        prompt: 'しゅうくんとの暇つぶしは楽しい？',
        storageKey: 'journey-20250716-q-025',
        readonlyAfterSave: true,
      },
      {
        id: 'journey-20250716-move-026',
        type: 'move',
        mode: 'flight',
        from: '福岡空港',
        to: '成田空港→家',
        distanceKm: 1216,
        description: '移動:飛行機 福岡空港→成田空港→家  （1,216km）',
      },
    ],
  },
  {
    id: 'journey-20250818',
    title: '旅ログ 2025-08-18',
    date: '2025-08-18',
    steps: [
      {
        id: 'journey-20250818-move-001',
        type: 'move',
        mode: 'flight',
        from: '家',
        to: '羽田空港→北九州空港→JR城野',
        distanceKm: 1091,
        description: '移動:飛行機 家→羽田空港→北九州空港→JR城野  (1,091km)',
      },
      {
        id: 'journey-20250818-episode-002',
        type: 'episode',
        text: [
          '初の城野駅！',
          '彩音の住んでる街でテンション爆上がりうぇい',
        ],
        photo: {
          src: '/images/user/IMG_0840.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250818-episode-004',
        type: 'episode',
        text: [
          '彩音のお家まで迎えに行ってくら寿司！',
          '見覚えあるなあ。',
          'くら寿司の横のラブホへ。',
        ],
        photo: {
          src: '/images/user/IMG_0853.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250818-episode-006',
        type: 'episode',
        text: [
          'くら寿司の横にラーメン屋が！',
          'とてもおいしかった！',
        ],
        photo: {
          src: '/images/user/IMG_0859.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250819',
    title: '旅ログ 2025-08-19',
    date: '2025-08-19',
    steps: [
      {
        id: 'journey-20250819-episode-001',
        type: 'episode',
        text: [
          'なんと！',
          '初カラオケ！',
          'あやねは音程が上手だった！',
        ],
        photo: {
          src: '/images/user/IMG_0865 2.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250819-episode-003',
        type: 'episode',
        text: [
          'うどんを歌ってくれるの最高や！',
        ],
        photo: {
          src: '/images/user/IMG_0870 2.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250819-episode-005',
        type: 'episode',
        text: [
          '小倉の行きたかったお店でクレープ！',
          'めちゃうまあだった！',
        ],
        photo: {
          src: '/images/user/IMG_0880.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250819-episode-007',
        type: 'episode',
        text: [
          'あやね、初マッサージ機でご満悦！',
          'かわいい',
        ],
        photo: {
          src: '/images/user/IMG_0882.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250819-episode-009',
        type: 'episode',
        text: [
          'やはりラブホ飯は無しではない',
        ],
        photo: {
          src: '/images/user/IMG_0889.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250819-episode-011',
        type: 'episode',
        text: [
          'こんなかわいい女の子が！',
          '！',
        ],
        photo: {
          src: '/images/user/IMG_0894.jpeg',
          alt: '旅の写真',
        },
      },
    ],
  },
  {
    id: 'journey-20250820',
    title: '旅ログ 2025-08-20',
    date: '2025-08-20',
    steps: [
      {
        id: 'journey-20250820-episode-001',
        type: 'episode',
        text: [
          '門司港へ移動！',
          '焼きカレーは今度食べる。',
          '駅舎が素敵でしたな！',
        ],
        photo: {
          src: '/images/user/IMG_0905.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-episode-003',
        type: 'episode',
        text: [
          'いつもピースしてくれてかわいいねありがとう',
        ],
        photo: {
          src: '/images/user/IMG_0919.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-episode-005',
        type: 'episode',
        text: [
          '世界の貨幣ガチャにハマってしまう。',
          '彩音がお札くれた！',
        ],
        photo: {
          src: '/images/user/IMG_0922.jpeg',
          alt: '000',
        },
      },
      {
        id: 'journey-20250820-episode-007',
        type: 'episode',
        text: [
          'かき氷がキンキン🍧',
        ],
        photo: {
          src: '/images/user/IMG_0926.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-episode-009',
        type: 'episode',
        text: [
          'お腹空いてきたよまじで',
        ],
        photo: {
          src: '/images/user/IMG_0929.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-episode-011',
        type: 'episode',
        text: [
          'ととろと！',
          '2人ともかわいいねえ',
        ],
        photo: {
          src: '/images/user/IMG_0932.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-episode-013',
        type: 'episode',
        text: [
          '2人ともかわいいよお！',
        ],
        photo: {
          src: '/images/user/IMG_0938.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-episode-015',
        type: 'episode',
        text: [
          '小倉に戻った。',
          '傘を持ってくれた彩音、紳士だ！',
        ],
        photo: {
          src: '/images/user/IMG_0955.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-episode-017',
        type: 'episode',
        text: [
          'あやねの権兵衛に！',
          '！',
          'これまじでうますぎるから次三つ頼む。',
        ],
        photo: {
          src: '/images/user/IMG_0964.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-episode-019',
        type: 'episode',
        text: [
          'やっぱり彩音の鶏皮が1番やで！',
        ],
        photo: {
          src: '/images/user/IMG_0966.jpeg',
          alt: '旅の写真',
        },
      },
      {
        id: 'journey-20250820-move-021',
        type: 'move',
        mode: 'bus',
        from: '小倉駅',
        to: 'バスタ新宿→家',
        distanceKm: 1339,
        description: '移動：バス　小倉駅→バスタ新宿→家　(1,339km)',
      },
    ],
  },
]


export const journeys: Journey[] = newJourneyDefinitions.map((journey: JourneyInput) => {
  const distanceKm = journey.steps.reduce((total: number, step: Journey['steps'][number]) => {
    const stepDistance = typeof step.distanceKm === 'number' ? step.distanceKm : 0
    return total + stepDistance
  }, 0)

  return {
    ...journey,
    distanceKm,
  }
})
