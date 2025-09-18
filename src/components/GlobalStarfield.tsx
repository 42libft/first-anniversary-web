export const GlobalStarfield = () => {
  const makeStars = (seed: number) => {
    const rows = 9
    const cols = 72
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
      <div className="global-moon">☽</div>
      <pre className="global-stars twinkle-a">{skyA}</pre>
      <pre className="global-stars twinkle-b">{skyB}</pre>
    </div>
  )
}

