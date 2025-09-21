export interface MeetupPage {
  id: string
  monthLabel: string
  title: string
  subtitle: string
  description: string
  memoryPoints: string[]
  background: string
  accent: string
  ambient: string
  photo: {
    src: string
    alt: string
    objectPosition?: string
  }
  footnote?: string
}

export const meetupPages: MeetupPage[] = [
  {
    id: '2023-10-fukuoka',
    monthLabel: '2023.10 Fukuoka',
    title: '空フェス夜市アフター',
    subtitle: 'ネオンの余韻と唐揚げの香りが混ざった夜。',
    description:
      '屋台の裏通りで撮った一枚。提灯の光に照らされた笑顔が、旅の始まりを象徴するページ。',
    memoryPoints: [
      'ネオン看板の前で30秒セルフタイマー',
      '明太バター唐揚げとラムネをシェア',
      '宿へ帰る坂道で手の温度を確認',
    ],
    background:
      'radial-gradient(circle at 18% 24%, rgba(255, 102, 196, 0.36), transparent 52%), radial-gradient(circle at 78% 68%, rgba(96, 148, 255, 0.35), transparent 55%), linear-gradient(145deg, rgba(23, 22, 58, 0.95), rgba(12, 16, 46, 0.96))',
    accent: 'rgba(255, 153, 220, 0.65)',
    ambient: 'rgba(10, 14, 40, 0.65)',
    photo: {
      src: 'https://images.placeholders.dev/?width=720&height=900&text=Night+Market+After',
      alt: 'ネオンが灯る夜市の路地で肩を寄せ合うふたり',
      objectPosition: 'center top',
    },
    footnote: '写真はiPhone 16 Proで撮影。色調補正なしのまま掲載。',
  },
  {
    id: '2023-12-letter',
    monthLabel: '2023.12 Tokyo',
    title: '年末の手紙交換',
    subtitle: '手袋越しに封筒を渡した、静かな冬の夜。',
    description:
      'イルミネーションの河川敷で手紙を交換した瞬間。雪は降らなかったけれど、吐息が白く揺れていた。',
    memoryPoints: [
      '橋の欄干をライトで照らして撮影',
      '手紙を読む前に深呼吸3回',
      'その場で録音した音声メモを後日Resultで再生予定',
    ],
    background:
      'radial-gradient(circle at 22% 18%, rgba(120, 190, 255, 0.42), transparent 58%), radial-gradient(circle at 72% 78%, rgba(255, 220, 255, 0.35), transparent 55%), linear-gradient(160deg, rgba(16, 26, 66, 0.95), rgba(8, 12, 40, 0.96))',
    accent: 'rgba(120, 190, 255, 0.7)',
    ambient: 'rgba(6, 10, 30, 0.72)',
    photo: {
      src: 'https://images.placeholders.dev/?width=720&height=900&text=Winter+Letter',
      alt: '冬の河川敷で封筒を差し出す手元のアップ',
      objectPosition: 'center',
    },
  },
  {
    id: '2024-02-tokyo',
    monthLabel: '2024.02 Tokyo',
    title: 'バレンタイン前夜の作戦会議',
    subtitle: '展望デッキとホテルラウンジをハシゴした夜。',
    description:
      '街を見下ろしながら翌日の段取りを決めたページ。手帳とチョコのリボンが写り込んでいるのがポイント。',
    memoryPoints: [
      '展望デッキのガラス越しに撮影して反射を活かす',
      'サプライズ手順を箇条書きで確認',
      'ラウンジで頼んだココアを飲み干すまでの所要時間は4分',
    ],
    background:
      'radial-gradient(circle at 82% 22%, rgba(255, 102, 196, 0.45), transparent 52%), radial-gradient(circle at 18% 78%, rgba(88, 147, 255, 0.35), transparent 55%), linear-gradient(165deg, rgba(42, 20, 68, 0.92), rgba(14, 16, 52, 0.96))',
    accent: 'rgba(255, 102, 196, 0.6)',
    ambient: 'rgba(18, 16, 46, 0.72)',
    photo: {
      src: 'https://images.placeholders.dev/?width=720&height=900&text=Valentine+Prep',
      alt: '東京の夜景と並ぶ手帳とチョコレート',
    },
  },
  {
    id: '2024-07-finale',
    monthLabel: '2024.07 Fukuoka',
    title: '流星群フィナーレ',
    subtitle: '花火と流星のダブルフィナーレを浴びた晩。',
    description:
      '夏祭りの余韻を閉じ込めたラストページ。川辺の風と遠くの歓声を思い出すように、光の粒を散りばめた。',
    memoryPoints: [
      '長時間露光で流星を3本キャッチ',
      '花火の音が届くまでのタイムラグを計測',
      '帰りのタクシーでResultの構成案を決定',
    ],
    background:
      'radial-gradient(circle at 26% 24%, rgba(255, 217, 140, 0.45), transparent 55%), radial-gradient(circle at 74% 76%, rgba(120, 225, 255, 0.4), transparent 58%), linear-gradient(150deg, rgba(18, 32, 78, 0.94), rgba(9, 12, 38, 0.95))',
    accent: 'rgba(255, 217, 140, 0.65)',
    ambient: 'rgba(10, 16, 40, 0.68)',
    photo: {
      src: 'https://images.placeholders.dev/?width=720&height=900&text=Stardust+Finale',
      alt: '川辺で流星群と花火を見上げるふたりのシルエット',
      objectPosition: 'center bottom',
    },
    footnote: 'Result画面ではここで取得した距離とリンクさせてハイライト演出を予定。',
  },
]
