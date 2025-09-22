import { useEffect, useState } from 'react'

export const DevPanel = () => {
  const [speedMin, setSpeedMin] = useState(0.00024)
  const [speedMax, setSpeedMax] = useState(0.00034)
  const [gapT, setGapT] = useState(0.06)

  const apply = () => {
    window.dispatchEvent(new CustomEvent('devpanel:prefs', { detail: { streamSpeedMin: speedMin, streamSpeedMax: speedMax, gapT } }))
  }
  const spawn = () => {
    window.dispatchEvent(new Event('devpanel:spawn'))
  }
  const clear = () => {
    window.dispatchEvent(new Event('devpanel:clear'))
  }

  useEffect(() => { apply() }, [])

  const wrap = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: number) => void) => {
    const v = parseFloat(e.target.value)
    if (!Number.isNaN(v)) setter(v)
  }

  return (
    <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 99, pointerEvents: 'auto' }}>
      <div style={{ background: 'rgba(8,12,32,0.75)', border: '1px solid rgba(160,180,255,0.35)', borderRadius: 12, padding: '10px 12px', width: 260, color: '#cdd7ff', fontSize: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, letterSpacing: '0.08em' }}>Dev Panel (temp)</div>
        <label style={{ display: 'block', marginBottom: 6 }}>
          speedMin
          <input type="number" step="0.00001" value={speedMin} onChange={(e) => wrap(e, setSpeedMin)} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 6 }}>
          speedMax
          <input type="number" step="0.00001" value={speedMax} onChange={(e) => wrap(e, setSpeedMax)} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          gapT
          <input type="number" step="0.01" value={gapT} onChange={(e) => wrap(e, setGapT)} style={{ width: '100%' }} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={apply} style={{ flex: 1 }}>Apply</button>
          <button type="button" onClick={spawn} style={{ flex: 1 }}>Spawn</button>
          <button type="button" onClick={clear} style={{ flex: 1 }}>Clear</button>
        </div>
      </div>
    </div>
  )
}

