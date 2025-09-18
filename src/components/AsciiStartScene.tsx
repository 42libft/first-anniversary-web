export const AsciiStartScene = () => {
  // random-ish starfield (deterministic within one render)
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
  const skyBlockA = makeStars(1)
  const skyBlockB = makeStars(2)

  const groundUnit = '__^___—_____^____—__  '
  const groundBlock = (groundUnit.repeat(12) + '\n').repeat(2)


  return (
    <div className="ascii-scene" aria-hidden="true">
      {/* moon (static crescent) */}
      <div style={{ position: 'absolute', top: '1ch', right: '4ch', opacity: 0.9 }}>☽</div>

      <div className="ascii-layer ascii-sky">
        <span className="twinkle-a">{skyBlockA}</span>
        <span className="twinkle-b" style={{ position: 'absolute', inset: 0 }}>{skyBlockB}</span>
      </div>
      {/* mask to prevent stars overlapping the ground area */}
      <div className="ascii-bottom-mask" />
      {/* yatai removed as requested */}
      <div className="ascii-layer ascii-ground">
        <span className="ascii-scroll ascii-scroll--slow">
          {groundBlock}
          {groundBlock}
        </span>
      </div>

      {/* two characters fixed center */}
      <div className="ascii-characters">
        <div className="ascii-walk">(•‿•) ♡  (•‿•)</div>
      </div>
    </div>
  )
}
