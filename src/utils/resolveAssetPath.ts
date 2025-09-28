export function resolveAssetPath(path: string): string
export function resolveAssetPath(path: undefined): undefined
export function resolveAssetPath(path?: string): string | undefined {
  if (!path) return path
  if (path.startsWith('data:')) return path
  if (/^(?:https?:)?\/\//.test(path)) return path

  const base = import.meta.env.BASE_URL ?? '/'
  const sanitizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${sanitizedBase}${normalizedPath}`
}
