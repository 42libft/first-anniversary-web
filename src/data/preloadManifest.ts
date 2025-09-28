import { journeys } from './journeys'
import { meetupPages } from './meetups'
import { resultLegends } from './result'
import { resolveAssetPath } from '../utils/assetPaths'

export type PreloadAssetType = 'image' | 'json' | 'audio'

export interface PreloadAsset {
  id: string
  url: string
  label: string
  category: string
  type: PreloadAssetType
  priority?: number
}

const createAssetId = (category: string, url: string) => `${category}:${url}`

const toLabel = (url: string) => {
  try {
    const parsed = new URL(url, 'https://placeholder.local')
    const pathname = parsed.pathname.replace(/^\/+/, '')
    const tail = pathname.split('/').pop()
    if (tail && tail.length > 0) return tail
  } catch (error) {
    // ignore invalid URL parse
  }
  return url
}

const localImageSet = new Set<string>()

journeys.forEach((journey) => {
  journey.steps.forEach((step) => {
    if (step.type === 'episode' && step.photo?.src) {
      localImageSet.add(step.photo.src)
    }
    if (step.type === 'move' && step.mapImage?.src) {
      localImageSet.add(step.mapImage.src)
    }
  })
})

resultLegends.forEach((legend) => {
  if (legend.portrait?.src) {
    localImageSet.add(legend.portrait.src)
  }
})

const remoteMeetupImages = new Set<string>()

meetupPages.forEach((page) => {
  if (page.photo?.src) {
    remoteMeetupImages.add(page.photo.src)
  }
})

const dataFiles = ['/data/messages-corpus.json']

const makeAssets = (options: {
  urls: Iterable<string>
  category: string
  type: PreloadAssetType
  priority?: number
}): PreloadAsset[] => {
  const { urls, category, type, priority } = options
  const out: PreloadAsset[] = []
  for (const url of urls) {
    const resolvedUrl = resolveAssetPath(url)
    out.push({
      id: createAssetId(category, resolvedUrl),
      url: resolvedUrl,
      type,
      category,
      label: toLabel(resolvedUrl),
      priority,
    })
  }
  return out
}

export const preloadAssets: PreloadAsset[] = [
  ...makeAssets({ urls: localImageSet, category: 'images/local', type: 'image', priority: 3 }),
  ...makeAssets({ urls: remoteMeetupImages, category: 'images/external', type: 'image', priority: 1 }),
  ...makeAssets({ urls: dataFiles, category: 'data/json', type: 'json', priority: 2 }),
]

export const totalPreloadAssets = preloadAssets.length

