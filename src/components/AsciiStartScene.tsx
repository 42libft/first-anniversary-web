export const AsciiStartScene = () => {
  // flatter ground (reduced undulation)
  const groundUnit = '____________________  '
  const groundBlock = (groundUnit.repeat(16) + '\n').repeat(2)


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
