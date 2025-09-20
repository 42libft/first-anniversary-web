export type PrologueLineVariant =
  | 'system'
  | 'narration'
  | 'self'
  | 'partner'

export interface PrologueLine {
  id: string
  variant: PrologueLineVariant
  speaker?: string
  text: string
}

export const prologueScript: PrologueLine[] = [
  {
    id: 'call-start',
    variant: 'system',
    text: '21:04 — 通話接続中…',
  },
  {
    id: 'partner-greeting',
    variant: 'partner',
    speaker: '彼女',
    text: 'もしもし？今大丈夫？夜風が気持ちよくて、つい掛けちゃった。',
  },
  {
    id: 'self-reply',
    variant: 'self',
    speaker: 'わたし',
    text: 'もちろん。今ちょうど帰り道。空が今日やばいくらい綺麗だよ。',
  },
  {
    id: 'partner-meteor',
    variant: 'partner',
    speaker: '彼女',
    text: 'ほんとだ、窓の外に流れ星。ねえ、今日って空フェスの日じゃなかった？',
  },
  {
    id: 'self-memory',
    variant: 'self',
    speaker: 'わたし',
    text: 'そうそう。去年あそこで屋台巡りしたよね。あの夜から、もう一年か…。',
  },
  {
    id: 'narration-spark',
    variant: 'narration',
    text: 'イヤホン越しのノイズが星屑みたいに弾け、画面に微かな光が走る。',
  },
  {
    id: 'system-sync',
    variant: 'system',
    text: '通知: タイムスタンプ同期リクエストを検出。',
  },
  {
    id: 'self-notice',
    variant: 'self',
    speaker: 'わたし',
    text: 'え、今ピコンって鳴った？日付の通知なんて設定してないのに…。',
  },
  {
    id: 'partner-alert',
    variant: 'partner',
    speaker: '彼女',
    text: 'こっちも出たよ。「タイムラインを巻き戻します」って。どういうこと？',
  },
  {
    id: 'narration-rollback',
    variant: 'narration',
    text: 'ロック画面の数字がゆっくり反転する。2025/10/07 → 2024/10/07。',
  },
  {
    id: 'self-realize',
    variant: 'self',
    speaker: 'わたし',
    text: '……待って。日付、ちょうど一年前に戻ってる。',
  },
  {
    id: 'partner-surprise',
    variant: 'partner',
    speaker: '彼女',
    text: 'うそ。記念日の前夜と同じ？そんなの、もう一回やるしかないじゃん。',
  },
  {
    id: 'narration-transition',
    variant: 'narration',
    text: '鼓動が高鳴る。これから一年分の旅を、もう一度追体験する。',
  },
]
