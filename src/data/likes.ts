export interface LikeMilestone {
  key: string
  label: string
  likesDelta: number
  cumulativeLikes: number
  description: string
}

type BaseLikeMilestone = Omit<LikeMilestone, 'cumulativeLikes'>

const baseLikes: BaseLikeMilestone[] = [
  {
    key: 'first-stamp',
    label: 'Day 03 スタンプ地獄',
    likesDelta: 36,
    description: 'LINE交換してすぐ、互いに「好き？」スタンプを送り合いまくった夜。',
  },
  {
    key: 'night-call',
    label: 'Day 12 初通話のあと',
    likesDelta: 58,
    description: '通話を切ったあとに「好き！」を連打し、寝落ちするまでハートが流れ続けた。',
  },
  {
    key: 'airport-welcome',
    label: 'Day 27 空港で再会',
    likesDelta: 120,
    description: '空フェス遠征での抱擁タイム。帰りのバス停でカウンターが一気に進んだ。',
  },
  {
    key: 'winter-letter',
    label: 'Day 74 手紙交換',
    likesDelta: 152,
    description: '年末の手紙と一緒に「好き」を言語化。お互いの文字を指でなぞりながら数えた。',
  },
  {
    key: 'valentine-plot',
    label: 'Day 120 バレンタイン作戦会議',
    likesDelta: 198,
    description: '空港でのチョコ受け渡しに向けた作戦会議。決意表明としてハートが炸裂。',
  },
  {
    key: 'meteor-festival',
    label: 'Day 274 流星祭り',
    likesDelta: 214,
    description: '夏の流星群を浴びながら「好き」を言い合う無限ループ。周りの屋台より明るかった。',
  },
  {
    key: 'anniversary-eve',
    label: 'Day 350 Anniversary Eve',
    likesDelta: 246,
    description: 'Result画面の原案を決めた晩。1024回目の「好き」をスクショして保存した。',
  },
]

let likesRunningTotal = 0
export const likesMilestones: LikeMilestone[] = baseLikes.map((entry) => {
  likesRunningTotal += entry.likesDelta
  return {
    ...entry,
    cumulativeLikes: likesRunningTotal,
  }
})

export const totalLikes =
  likesMilestones[likesMilestones.length - 1]?.cumulativeLikes ?? 0

export const confessionAnswer = {
  correct: 'you',
  explanation: '空フェス帰りのバス停で、あなたが先に「好き」って言ってくれた夜。',
} as const
