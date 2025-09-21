type GlobalStarfieldProps = {
  showShooting?: boolean
}

export const GlobalStarfield = ({ showShooting = false }: GlobalStarfieldProps) => {
  const makeStars = (seed: number) => {
    const rows = 80
    const cols = 300
    const stars: string[] = []
    const hash = (r: number, c: number) => {
      let x = (r * 374761393) ^ (c * 668265263) ^ (seed * 1597334677)
      x = (x ^ (x >>> 13)) * 1274126177
      x = (x ^ (x >>> 16)) >>> 0
      return x / 4294967295
    }
    for (let r = 0; r < rows; r++) {
      const offset = (r * 7 + seed * 11) % 5
      let line = ''.padEnd(offset, ' ')
      for (let c = 0; c < cols; c++) {
        const p = hash(r, c)
        line += p < 0.015 ? '*' : p < 0.035 ? '·' : ' '
      }
      stars.push(line)
    }
    return stars.join('\n') + '\n'
  }
  const skyA = makeStars(1)
  const skyB = makeStars(2)
  return (
    <div className="global-starfield" aria-hidden="true">
      {/* ultra-thin crescent (waxing) */}
      <svg className="global-moon-svg" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="8" fill="#ffd98a" />
        {/* cutout to make it thin crescent */}
        <circle cx="13.8" cy="12" r="8.2" fill="#0a0c2a" />
      </svg>
      <pre className="global-stars twinkle-a">{skyA}</pre>
      <pre className="global-stars twinkle-b">{skyB}</pre>
      {/* optional shooting stars (disabled by default) */}
      {showShooting ? (
        <>
          <div className="shooting-star shooting-a" />
          <div className="shooting-star shooting-b" />
          <div className="shooting-star shooting-c" />
        </>
      ) : null}
    </div>
  )
}
