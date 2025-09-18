export const AsciiStartScene = () => {
  // Duplicate content twice for seamless horizontal loop
  const sky = `··  ·   *     ·  ·   *    ·     *   ·  ·    *   ·   ·    *   ·  ·   *   ·\n`
  const skyBlock = sky.repeat(8)

  const groundUnit = `____________________  `
  const groundBlock = (groundUnit.repeat(20) + "\n").repeat(2)

  const yataiUnit = `  [◎]屋台  [◎]屋台  [◎]屋台  `
  const yataiBlock = (yataiUnit.repeat(10) + "\n").repeat(1)

  return (
    <div className="ascii-scene" aria-hidden="true">
      <div className="ascii-layer ascii-sky">
        <span className="ascii-scroll ascii-scroll--slow">
          {skyBlock}
          {skyBlock}
        </span>
      </div>
      <div className="ascii-layer ascii-yatai">
        <span className="ascii-scroll">
          {yataiBlock}
          {yataiBlock}
        </span>
      </div>
      <div className="ascii-layer ascii-ground">
        <span className="ascii-scroll ascii-scroll--fast">
          {groundBlock}
          {groundBlock}
        </span>
      </div>

      <div className="ascii-characters">
        {/* very small walking figures (two frames via CSS translate) */}
        <div className="ascii-walk">(•‿•)♡  (•‿•)</div>
      </div>
    </div>
  )
}

