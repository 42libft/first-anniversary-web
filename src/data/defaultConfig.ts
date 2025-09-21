import type { Config } from '../types/config'

export const defaultConfig: Config = {
  guild: {
    id: '123456789012345678',
  },
  channels: {
    welcome: '#welcome',
    verify_panel: '#verify-panel',
    roles_panel: '#roles',
    introductions: '#自己紹介',
    audit_log: '#audit-log',
    fallback_notice: '#welcome',
  },
  notion: {
    guidelines_url: 'https://www.notion.so/nyaimlab/onboarding-guide',
  },
  features: {
    count_bots_in_member_count: false,
    verify_mode: 'button',
  },
  messaging: {
    welcomeDmTemplate:
      'ようこそ Nyaimlab へ！\n1. ガイド：{notionUrl}\n2. ロール選択：#{roles_panel}\n3. 自己紹介：/introduce\n4. 最初の一歩：#募集 / #雑談 / VC',
    fallbackThreadMessage:
      'DMが送信できませんでした。以下のリンクからガイドとロール選択を確認してください。',
  },
  roles: {
    verified: '@Verified',
    selectable: [
      {
        id: 'apex',
        label: 'Apex',
        role: '@Apex',
        description: 'Apex Legends ロール',
        emoji: '🎮',
      },
      {
        id: 'vrchat',
        label: 'VRChat',
        role: '@VRChat',
        description: 'VRChat イベント参加者',
        emoji: '🪐',
      },
      {
        id: 'games',
        label: 'その他ゲーム',
        role: '@Games',
        description: 'その他ゲーム用ロール',
        emoji: '🕹️',
      },
      {
        id: 'global',
        label: 'Global',
        role: '@Global',
        description: '海外メンバー向けロール',
        emoji: '🌏',
      },
    ],
    optional: [
      {
        id: 'streamer',
        label: '配信者',
        role: '@Streamer',
        description: '配信活動をしているメンバー',
        emoji: '📡',
      },
      {
        id: 'creator',
        label: 'クリエイター',
        role: '@Creator',
        description: 'イラスト・動画・音楽などのクリエイター',
        emoji: '🎨',
      },
    ],
  },
  introductions: {
    fields: [
      {
        id: 'name',
        label: '名前',
        type: 'short',
        required: true,
        enabled: true,
        placeholder: 'Nyaimcat',
      },
      {
        id: 'age',
        label: '年齢',
        type: 'short',
        required: false,
        enabled: true,
        placeholder: '24',
      },
      {
        id: 'country',
        label: '出身国',
        type: 'short',
        required: true,
        enabled: true,
        placeholder: '日本',
      },
      {
        id: 'jpLevel',
        label: '日本語レベル',
        type: 'select',
        required: true,
        enabled: true,
        options: ['Native', 'Fluent', 'Conversational', 'Basic'],
      },
      {
        id: 'enLevel',
        label: '英語レベル',
        type: 'select',
        required: true,
        enabled: true,
        options: ['Native', 'Fluent', 'Conversational', 'Basic'],
      },
      {
        id: 'favoriteFood',
        label: '好きな食べ物',
        type: 'paragraph',
        required: false,
        enabled: true,
        placeholder: 'タピオカ / ラーメンなど',
      },
      {
        id: 'games',
        label: 'ゲーム情報',
        type: 'paragraph',
        required: false,
        enabled: true,
        placeholder: '好きなゲーム・ランクなど',
      },
      {
        id: 'comment',
        label: '一言コメント',
        type: 'paragraph',
        required: true,
        enabled: true,
        placeholder: 'よろしくお願いします！',
      },
    ],
    maxCharacters: {
      name: 32,
      comment: 200,
      favoriteFood: 120,
      games: 200,
    },
    imageAttachment: {
      allow: true,
      maxSizeMb: 5,
    },
    ngWords: ['spamword1', 'spamword2'],
  },
  verify: {
    messageId: null,
    button: {
      label: 'Verify',
      style: 'success',
      successMessage: '認証が完了しました！',
      alreadyVerifiedMessage: 'すでに認証済みです。',
    },
    reactionEmoji: '✅',
    acknowledgementMessage: 'Verifyボタンを押して認証を完了してください。',
  },
  locales: {
    timezone: 'Asia/Tokyo',
  },
  scrim: {
    enabled: false,
    summaryChannel: '#scrim-planning',
    managerChannel: '#manager',
    pollDay: 'sunday',
    remindHourJst: 21,
    notes: '日曜に翌週分のスクリム希望を確認し、3人揃ったらマネージャーへ通知します。',
  },
}
