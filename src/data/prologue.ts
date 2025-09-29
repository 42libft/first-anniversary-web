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
    speaker: 'れおん',
    text: 'はーあーい？　今日もお疲れ様！',
  },
  {
    id: 'self-reply',
    variant: 'self',
    speaker: 'libft',
    text: 'ありがとー　今ちょうど家帰ったよ。お腹すいたー',
  },
  {
    id: 'partner-meteor',
    variant: 'partner',
    speaker: 'れおん',
    text: 'しゅう君、今日はなんの日でしょーう？？',
  },
  {
    id: 'self-memory',
    variant: 'self',
    speaker: 'libft',
    text: 'ふふ、もちろんわかってるよ。あの夜から、もう一年か…。',
  },
  {
    id: 'narration-spark',
    variant: 'narration',
    text: 'イヤホン越しのノイズが星屑のように弾け、画面に微かな光が走る。',
  },
  {
    id: 'system-sync',
    variant: 'system',
    text: '通知: タイムスタンプ同期リクエストを検出。',
  },
  {
    id: 'self-notice',
    variant: 'self',
    speaker: 'libft',
    text: 'え、今ピコンって鳴った？日付の通知なんて設定してないのに…。',
  },
  {
    id: 'partner-alert',
    variant: 'partner',
    speaker: 'れおん',
    text: 'こっちも出たよ。「タイムラインを巻き戻します」って。どういうこと？',
  },
  {
    id: 'narration-rollback',
    variant: 'narration',
    text: 'ロック画面の数字がゆっくり反転する。2025/10/04 → 2024/10/04。',
  },
  {
    id: 'self-realize',
    variant: 'self',
    speaker: 'libft',
    text: '……待って。日付、ちょうど一年前に戻ってる。',
  },
  {
    id: 'partner-surprise',
    variant: 'partner',
    speaker: 'れおん',
    text: 'なにーーー！！',
  },
  {
    id: 'narration-transition',
    variant: 'narration',
    text:
      'この一年分の二人での思い出をもう一度…\nこの一年で一緒に過ごした日々を振り返ります。\nクイズや自由入力欄を通して思い出を忘れられないものにしましょう！',
  },
]
