export const GlobalStarfield = () => {
  const makeStars = (seed: number) => {
    // 大きめに生成して右/下で切れないようにする（密度は従来比）
    const rows = 80
    const cols = 300
    const stars: string[] = []
    for (let r = 0; r < rows; r++) {
      let line = ''
      for (let c = 0; c < cols; c++) {
        const n = (r * 131 + c * 73 + seed * 97) % 211
        line += n % 37 === 0 ? '*' : n % 53 === 0 ? '·' : ' '
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
    </div>
  )
}
