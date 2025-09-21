import type { Config } from '../types/config'

type Primitive = string | number | boolean | null

const isPrimitive = (value: unknown): value is Primitive =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

const formatString = (value: string): string => {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
  return `"${escaped}"`
}

const formatPrimitive = (value: Primitive): string => {
  if (value === null) {
    return 'null'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0'
  }

  return formatString(value)
}

const serialize = (value: unknown, indent = 0): string[] => {
  const indentStr = ' '.repeat(indent)

  if (isPrimitive(value)) {
    return [`${indentStr}${formatPrimitive(value)}`]
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${indentStr}[]`]
    }

    return value.flatMap((item) => {
      if (isPrimitive(item)) {
        return [`${indentStr}- ${formatPrimitive(item)}`]
      }

      const nested = serialize(item, indent + 2)
      return [`${indentStr}-`, ...nested]
    })
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)

    if (entries.length === 0) {
      return [`${indentStr}{}`]
    }

    return entries.flatMap(([key, val]) => {
      if (isPrimitive(val)) {
        return [`${indentStr}${key}: ${formatPrimitive(val)}`]
      }

      if (Array.isArray(val)) {
        if (val.length === 0) {
          return [`${indentStr}${key}: []`]
        }

        const nested = serialize(val, indent + 2)
        return [`${indentStr}${key}:`, ...nested]
      }

      if (val && typeof val === 'object') {
        const nested = serialize(val, indent + 2)
        return [`${indentStr}${key}:`, ...nested]
      }

      return [`${indentStr}${key}: null`]
    })
  }

  return [`${indentStr}null`]
}

export const generateConfigYaml = (config: Config): string => {
  const ordered = {
    guild: config.guild,
    channels: config.channels,
    notion: config.notion,
    features: config.features,
    messaging: config.messaging,
    roles: config.roles,
    introductions: config.introductions,
    verify: config.verify,
    locales: config.locales,
    scrim: config.scrim,
  }

  return serialize(ordered).join('\n')
}
