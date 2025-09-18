export const AsciiStartScene = () => {
  const groundUnit = '__^___—_____^____—__  '
  const groundBlock = (groundUnit.repeat(12) + '\n').repeat(2)


  return (
    <div className="ascii-scene" aria-hidden="true">
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
