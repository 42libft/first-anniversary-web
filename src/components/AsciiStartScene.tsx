export const AsciiStartScene = () => {
  // random-ish starfield (deterministic within one render)
  const rows = 8
  const cols = 64
  const stars = [] as string[]
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const n = (r * 17 + c * 23) % 97
      line += n % 19 === 0 ? '*' : n % 31 === 0 ? '·' : ' '
    }
    stars.push(line)
  }
  const skyBlock = stars.join('\n') + '\n'

  const groundUnit = '__^___—_____^____—__  '
  const groundBlock = (groundUnit.repeat(12) + '\n').repeat(2)

  const yataiUnit = ' [◎]屋台  [○]提灯  [◎]屋台  '
  const yataiBlock = (yataiUnit.repeat(8) + '\n')

  return (
    <div className="ascii-scene" aria-hidden="true">
      {/* moon (static) */}
      <div style={{ position: 'absolute', top: '1ch', right: '4ch', opacity: 0.9 }}>○</div>

      <div className="ascii-layer ascii-sky">
        <span>
          {skyBlock}
        </span>
      </div>
      <div className="ascii-layer ascii-yatai">
        <span className="ascii-scroll ascii-scroll--slow">
          {yataiBlock}
          {yataiBlock}
        </span>
      </div>
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
