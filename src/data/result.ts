export type ResultStatKey = 'distance' | 'messages' | 'likes' | 'quiz' | 'photos'

export interface ResultLegend {
  id: 'self' | 'partner'
  codename: string
  displayName: string
  role: string
  headline: string
  description: string
  emblem?: string
  statFocus: ResultStatKey
  portrait: {
    src: string
    alt: string
  }
}

export const resultLegends: ResultLegend[] = [
  {
    id: 'self',
    codename: 'Navigator',
    displayName: 'あなた',
    role: '旅のルートを描いたひと',
    headline: '距離3297km分の作戦を指揮',
    description:
      '移動プランの全ルートを記録し、旅ごとのサプライズを下準備した“ルートマスター”。',
    emblem: '旅ログ設計担当',
    statFocus: 'quiz',
    portrait: {
      src: '/images/prologue-self-placeholder.svg',
      alt: 'あなたのシルエットイラスト',
    },
  },
  {
    id: 'partner',
    codename: 'Stargazer',
    displayName: '彼女',
    role: '夜空のハイライト係',
    headline: '流星群とハートの演出担当',
    description:
      '思い出の瞬間をカメラとメッセージで収集し、Result演出の種を撒いた“ムードメーカー”。',
    emblem: 'ムードメーカー',
    statFocus: 'quiz',
    portrait: {
      src: '/images/prologue-partner-placeholder.svg',
      alt: '彼女のシルエットイラスト',
    },
  },
]

export interface QuizAnswerSpec {
  storageKey: string
  correctAnswer: string
  label: string
}

export const journeyQuizAnswerSpecs: QuizAnswerSpec[] = [
  {
    storageKey: 'travel-001-food',
    correctAnswer: 'サンドイッチ＆カフェラテ',
    label: '旅の初夜コンビニメニュー',
  },
  {
    storageKey: 'travel-002-plan',
    correctAnswer: '0時ぴったりにメッセージを送る',
    label: 'バレンタイン作戦の最終確認',
  },
  {
    storageKey: 'travel-003-highlight',
    correctAnswer: '流星群を見上げた瞬間',
    label: '夏祭りのハイライト',
  },
]

export const photoCaptureEstimate = 286
