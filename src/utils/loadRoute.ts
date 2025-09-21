export const loadRouteGeoJson = async (id: string) => {
  try {
    const res = await fetch(`/data/routes/${id}.geojson`, { cache: 'no-cache' })
    if (!res.ok) return undefined
    return (await res.json()) as unknown
  } catch {
    return undefined
  }
}

