import type { MeetupEntry } from '../types/meetup'

export const meetups: MeetupEntry[] = [
  {
    id: '2023-10-sky-fest',
    monthLabel: '2023.10',
    title: '空フェス夜市で合流',
    location: '福岡・空フェス夜市',
    summary:
      '福岡出張の最終日、終電ギリギリで合流した夜市。提灯の明かりに包まれながら、「ここから1年が始まるんだ」とふたりで笑った。',
    highlights: [
      '流星群を模したレーザー演出と同時に並んだスカイランタン',
      '屋台の炙り明太バターを半分こして頬がゆるむ',
      '帰り道に撮った最初のツーショットが今も待ち受け',
    ],
    photo: {
      url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1080&q=80',
      alt: '夜市の提灯が連なる通り',
      aspectRatio: 3 / 4,
      caption: '空フェス夜市にて — 1年の旅の始まり',
    },
    art: {
      gradient: `
        radial-gradient(circle at 18% 22%, rgba(255, 160, 214, 0.6), transparent 58%),
        radial-gradient(circle at 74% 18%, rgba(86, 207, 255, 0.42), transparent 52%),
        radial-gradient(circle at 78% 78%, rgba(255, 209, 102, 0.3), transparent 60%),
        linear-gradient(145deg, rgba(28, 16, 60, 0.95), rgba(6, 8, 32, 0.92))
      `,
      overlay:
        'repeating-conic-gradient(from 45deg, rgba(255,255,255,0.08) 0deg 10deg, transparent 10deg 24deg)',
      overlayOpacity: 0.42,
      accent: '#ff9edb',
      noiseOpacity: 0.18,
    },
    memo:
      'イントロで描いた「夜空のプログラム起動」から繋がる、リアルな空フェスの思い出。',
  },
  {
    id: '2023-12-illumination',
    monthLabel: '2023.12',
    title: '冬のイルミ散歩',
    location: '東京・恵比寿ガーデンプレイス',
    summary:
      '真冬の青いイルミネーションとホットワイン。少し赤い鼻を笑い合いながら、今年の抱負をこっそり録音した夜。',
    highlights: [
      'ポラロイド写真を撮った瞬間、雪のように光が舞った',
      '「プレゼントは手紙でお願い」と約束した原点',
      '寒さに負けずにベンチで語った30分の未来メモ',
    ],
    photo: {
      url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1080&q=80',
      alt: '冬のイルミネーションが輝く並木道',
      aspectRatio: 2 / 3,
      caption: '青い光で染まった帰り道',
    },
    art: {
      gradient: `
        radial-gradient(circle at 20% 24%, rgba(137, 183, 255, 0.58), transparent 60%),
        radial-gradient(circle at 80% 30%, rgba(255, 166, 240, 0.45), transparent 55%),
        radial-gradient(circle at 68% 82%, rgba(152, 228, 255, 0.3), transparent 62%),
        linear-gradient(160deg, rgba(18, 27, 68, 0.95), rgba(9, 10, 32, 0.92))
      `,
      overlay:
        'repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 12px, transparent 12px 36px)',
      overlayOpacity: 0.35,
      accent: '#9cd4ff',
      noiseOpacity: 0.2,
    },
    memo: '鼻先が赤くなるほど寒いのに、写真からは熱量しか伝わってこないのが不思議。',
  },
  {
    id: '2024-02-onsen',
    monthLabel: '2024.02',
    title: '朝霧の温泉トリップ',
    location: '大分・由布院',
    summary:
      '湯けむりの向こうで夜明けを待つ露天風呂。指先がふやけるまで語った「次の旅先リスト」が、今もふたりのToDo。',
    highlights: [
      '貸切露天で聞いた音は、湯の音と遠くの鳥の声だけ',
      '朝食のフルーツ牛乳で乾杯 — 旅の定番ルール化',
      '帰りの特急で書いた交換日記1ページ目',
    ],
    photo: {
      url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      alt: '湯けむりが立ち上る温泉と山並み',
      aspectRatio: 4 / 3,
      caption: '朝霧に包まれた由布院の露天風呂',
    },
    art: {
      gradient: `
        radial-gradient(circle at 28% 28%, rgba(144, 255, 206, 0.42), transparent 58%),
        radial-gradient(circle at 74% 22%, rgba(255, 179, 230, 0.42), transparent 55%),
        radial-gradient(circle at 52% 78%, rgba(104, 210, 255, 0.35), transparent 60%),
        linear-gradient(170deg, rgba(10, 30, 48, 0.95), rgba(8, 17, 38, 0.95))
      `,
      overlay:
        'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0 18px, transparent 18px 42px)',
      overlayOpacity: 0.32,
      accent: '#7ef5c4',
      noiseOpacity: 0.16,
    },
    memo:
      '湯上がりの火照った頬で撮ったセルフィーが、旅アルバムの中で一番リラックスした表情かもしれない。',
  },
  {
    id: '2024-04-hanami',
    monthLabel: '2024.04',
    title: '花びらのトンネル',
    location: '東京・目黒川沿い',
    summary:
      '散りぎわの桜吹雪。風が吹くたびに傘がピンクに染まって、写真も記憶もパステルフィルムのようになった春の午後。',
    highlights: [
      '満開を過ぎた枝から降る花びらシャワーで笑い声が止まらない',
      'サンドイッチと桜餅を持ち寄ってベンチで即席ピクニック',
      '川面に浮かぶ花びらを指差しながら作った小さな俳句ゲーム',
    ],
    photo: {
      url: 'https://images.unsplash.com/photo-1490772888775-55fceea286b7?auto=format&fit=crop&w=1080&q=80',
      alt: '桜が咲く川沿いの道を歩くふたり',
      aspectRatio: 3 / 4,
      caption: '目黒川の桜吹雪で足元までピンク色に',
    },
    art: {
      gradient: `
        radial-gradient(circle at 20% 26%, rgba(255, 186, 206, 0.58), transparent 60%),
        radial-gradient(circle at 78% 18%, rgba(255, 235, 166, 0.45), transparent 55%),
        radial-gradient(circle at 50% 78%, rgba(180, 220, 255, 0.32), transparent 65%),
        linear-gradient(145deg, rgba(28, 12, 52, 0.92), rgba(48, 12, 45, 0.9))
      `,
      overlay:
        'repeating-conic-gradient(from 90deg, rgba(255,255,255,0.08) 0deg 5deg, transparent 5deg 15deg)',
      overlayOpacity: 0.38,
      accent: '#ffb3c6',
      noiseOpacity: 0.18,
    },
    memo: '花吹雪の動画をスローモーションで撮ったら、まるでMVのワンシーンみたいで何度も見返した。',
  },
  {
    id: '2024-07-beach',
    monthLabel: '2024.07',
    title: '波待ちのサンセット',
    location: '福岡・糸島サンセットビーチ',
    summary:
      '夕焼けの空と潮の匂い。サンセットに合わせて波の音が揃って、ふたりで裸足のまま砂に未来年表を描いた夏。',
    highlights: [
      '水平線に沈む瞬間、ハイタッチで夏の始まりを宣言',
      '写ルンですで撮った逆光シルエットが最高の一枚に',
      '夜は星空を見ながら、距離HUDの数字を数えて笑った',
    ],
    photo: {
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      alt: '夕焼けのビーチで寄り添うふたりの影',
      aspectRatio: 16 / 9,
      caption: '潮風と夕焼けのグラデーション',
    },
    art: {
      gradient: `
        radial-gradient(circle at 18% 32%, rgba(255, 177, 105, 0.52), transparent 60%),
        radial-gradient(circle at 82% 22%, rgba(255, 114, 215, 0.45), transparent 55%),
        radial-gradient(circle at 70% 80%, rgba(96, 210, 255, 0.35), transparent 60%),
        linear-gradient(160deg, rgba(15, 24, 64, 0.95), rgba(10, 9, 32, 0.92))
      `,
      overlay:
        'repeating-linear-gradient(110deg, rgba(255,255,255,0.06) 0 8px, transparent 8px 28px)',
      overlayOpacity: 0.32,
      accent: '#ffc17a',
      noiseOpacity: 0.2,
    },
    memo: '足跡をたどって撮ったドローン風ショットを、Resultの背景に仕込みたい。',
  },
  {
    id: '2024-09-anniversary',
    monthLabel: '2024.09',
    title: '1周年の前夜祭',
    location: '東京・マンションのルーフトップ',
    summary:
      '都会の夜景を背景にしたささやかな前夜祭。手作りのライトと音楽でデッキを飾って、1年分の距離と好きの数を一緒に振り返った。',
    highlights: [
      '手すりに吊るしたフェアリーライトが星座みたいに瞬く',
      'タブレットで流したプレイリストに合わせて即席ダンス',
      'Apexリザルト案をホワイトボードに描きながら決めた夜',
    ],
    photo: {
      url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1080&q=80',
      alt: '都会の夜景を見下ろすルーフトップの灯り',
      aspectRatio: 3 / 4,
      caption: 'ルーフトップ前夜祭のセッティング',
    },
    art: {
      gradient: `
        radial-gradient(circle at 24% 24%, rgba(255, 166, 255, 0.55), transparent 58%),
        radial-gradient(circle at 78% 28%, rgba(118, 215, 255, 0.45), transparent 55%),
        radial-gradient(circle at 56% 78%, rgba(255, 220, 141, 0.3), transparent 60%),
        linear-gradient(165deg, rgba(18, 18, 54, 0.95), rgba(9, 6, 32, 0.92))
      `,
      overlay:
        'repeating-conic-gradient(from 30deg, rgba(255,255,255,0.1) 0deg 4deg, transparent 4deg 14deg)',
      overlayOpacity: 0.42,
      accent: '#d0a7ff',
      noiseOpacity: 0.22,
    },
    memo:
      'ここで撮った夜景の写真をResultの背景に重ねて、Introのターミナル演出とループさせる予定。',
  },
]
