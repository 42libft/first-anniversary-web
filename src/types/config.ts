export type VerifyMode = 'button' | 'reaction'

export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger'

export interface RoleOption {
  id: string
  label: string
  role: string
  description?: string
  emoji?: string
}

export type IntroductionFieldType = 'short' | 'paragraph' | 'select'

export type IntroductionFieldId =
  | 'name'
  | 'age'
  | 'country'
  | 'jpLevel'
  | 'enLevel'
  | 'favoriteFood'
  | 'games'
  | 'comment'

export interface IntroductionField {
  id: IntroductionFieldId
  label: string
  type: IntroductionFieldType
  required: boolean
  enabled: boolean
  placeholder?: string
  options?: string[]
}

export interface IntroductionLimits {
  name: number
  comment: number
  favoriteFood: number
  games: number
}

export interface Config {
  guild: {
    id: string
  }
  channels: {
    welcome: string
    verify_panel: string
    roles_panel: string
    introductions: string
    audit_log: string
    fallback_notice: string
  }
  notion: {
    guidelines_url: string
  }
  features: {
    count_bots_in_member_count: boolean
    verify_mode: VerifyMode
  }
  messaging: {
    welcomeDmTemplate: string
    fallbackThreadMessage: string
  }
  roles: {
    verified: string
    selectable: RoleOption[]
    optional: RoleOption[]
  }
  introductions: {
    fields: IntroductionField[]
    maxCharacters: IntroductionLimits
    imageAttachment: {
      allow: boolean
      maxSizeMb: number
    }
    ngWords: string[]
  }
  verify: {
    messageId: string | null
    button: {
      label: string
      style: ButtonStyle
      successMessage: string
      alreadyVerifiedMessage: string
    }
    reactionEmoji: string
    acknowledgementMessage: string
  }
  locales: {
    timezone: string
  }
  scrim: {
    enabled: boolean
    summaryChannel: string
    managerChannel: string
    pollDay:
      | 'sunday'
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday'
    remindHourJst: number
    notes: string
  }
}
