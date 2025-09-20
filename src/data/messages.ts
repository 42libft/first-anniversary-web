export type MessageSpeaker = 'me' | 'you'

export interface MessagePreview {
  speaker: MessageSpeaker
  text: string
  timestamp: string
}

export interface MessageMilestone {
  month: string
  label: string
  monthlyTotal: number
  cumulativeTotal: number
  cumulativeDistanceKm: number
  highlight: string
  preview: MessagePreview[]
}

type BaseMessageMilestone = Omit<MessageMilestone, 'cumulativeTotal'>

const baseMilestones: BaseMessageMilestone[] = [
  {
    month: '2023-10',
    label: '2023.10 空フェスの夜',
    monthlyTotal: 248,
    cumulativeDistanceKm: 1080,
    highlight: '初めての東京⇄福岡往復のあと、毎晩通話する習慣がスタート。',
    preview: [
      { speaker: 'me', text: '今日はありがとう！空フェスまじで夢みたいだったね', timestamp: '22:18' },
      { speaker: 'you', text: 'こっちこそ！帰りの空港でもずっと笑ってたよ', timestamp: '22:20' },
      { speaker: 'me', text: 'またすぐ会えるように、連絡取りまくろう', timestamp: '22:21' },
    ],
  },
  {
    month: '2023-11',
    label: '2023.11 深夜テンション',
    monthlyTotal: 412,
    cumulativeDistanceKm: 1080,
    highlight: '週5ペースの通話で、眠気とテンションの高低をメモして遊ぶ。',
    preview: [
      { speaker: 'you', text: '寝る前に今日のテンション表つくろー', timestamp: '23:58' },
      { speaker: 'me', text: '朝からずっと 4 → 5 → 8 で今はMAX！', timestamp: '00:01' },
      { speaker: 'you', text: 'わたしは 3 → 7 → 9。眠いけど話したい〜', timestamp: '00:02' },
    ],
  },
  {
    month: '2023-12',
    label: '2023.12 冬の準備',
    monthlyTotal: 505,
    cumulativeDistanceKm: 1080,
    highlight: '年末のサプライズ準備で、写真や歌を送り合う夜が続く。',
    preview: [
      { speaker: 'me', text: '明日のプレゼント作戦、これでどう？', timestamp: '21:15' },
      { speaker: 'you', text: '最高！わたしも歌録ったからあとで送るね', timestamp: '21:17' },
      { speaker: 'me', text: '受け取る準備しておく。通話で一緒に聴こう', timestamp: '21:18' },
    ],
  },
  {
    month: '2024-02',
    label: '2024.02 バレンタイン前夜',
    monthlyTotal: 598,
    cumulativeDistanceKm: 2160,
    highlight: '2往復目が決定。空港で渡すチョコの温度管理を本気で議論。',
    preview: [
      { speaker: 'you', text: '空港でチョコ溶けないかな…保冷剤どうしよ', timestamp: '19:04' },
      { speaker: 'me', text: 'ゲートまで15分だし、ケースに入れたら完璧！', timestamp: '19:05' },
      { speaker: 'you', text: 'さすが発明王。お礼に空港でハグ2回追加', timestamp: '19:06' },
    ],
  },
  {
    month: '2024-04',
    label: '2024.04 春の作戦会議',
    monthlyTotal: 642,
    cumulativeDistanceKm: 2160,
    highlight: '距離2160km分の思い出を振り返りながら、春以降の計画を共有。',
    preview: [
      { speaker: 'me', text: '次はどこ行く？海も山も行きたい！', timestamp: '20:11' },
      { speaker: 'you', text: '夏祭りも絶対。距離2160km分のご褒美旅しよ', timestamp: '20:12' },
      { speaker: 'me', text: 'そのセリフ保存した。夏まで毎日読む', timestamp: '20:13' },
    ],
  },
  {
    month: '2024-07',
    label: '2024.07 夏祭り準備',
    monthlyTotal: 708,
    cumulativeDistanceKm: 3240,
    highlight: '3往復目の前夜。現地タイムテーブルを秒単位で共有し合う。',
    preview: [
      { speaker: 'you', text: '屋台の並び順決めたよ！かき氷→金魚→射的', timestamp: '18:42' },
      { speaker: 'me', text: '完璧。流星群の時間も押さえた。3240km目のご褒美', timestamp: '18:43' },
      { speaker: 'you', text: 'このスプレッドシート永久保存ね', timestamp: '18:44' },
    ],
  },
  {
    month: '2024-08',
    label: '2024.08 Anniversary Eve',
    monthlyTotal: 834,
    cumulativeDistanceKm: 3240,
    highlight: '一年分のメッセージをプレイバック。Result演出の構想をここで固めた。',
    preview: [
      { speaker: 'me', text: 'この一年で3947通はエモすぎ', timestamp: '23:10' },
      { speaker: 'you', text: '距離3240kmより長い、言葉の旅だね', timestamp: '23:11' },
      { speaker: 'me', text: 'Result画面で全部証明しよう', timestamp: '23:12' },
    ],
  },
]

let runningTotal = 0
export const messageMilestones: MessageMilestone[] = baseMilestones.map((milestone) => {
  runningTotal += milestone.monthlyTotal
  return {
    ...milestone,
    cumulativeTotal: runningTotal,
  }
})

export const totalMessages =
  messageMilestones[messageMilestones.length - 1]?.cumulativeTotal ?? 0

export const busiestMessageMilestone = messageMilestones.reduce(
  (previous, current) =>
    current.monthlyTotal > previous.monthlyTotal ? current : previous,
  messageMilestones[0]
)
