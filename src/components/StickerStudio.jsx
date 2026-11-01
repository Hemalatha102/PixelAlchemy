import { useEffect, useRef, useState } from 'react'
import { Copy, Download, Redo2, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react'
import './StickerStudio.css'

const WIDTH = 900
const HEIGHT = 620

const categories = [
  { name: 'Cute Animals', stickers: ['🐱', '🐶', '🐰', '🦊', '🐼', '🐸', '🐻', '🦋'] },
  { name: 'Flowers & Nature', stickers: ['🌸', '🌻', '🌷', '🍀', '🌿', '🍄', '🌼', '🌈'] },
  { name: 'Hearts & Love', stickers: ['❤️', '💖', '💜', '💌', '💕', '💝', '💗', '💘'] },
  { name: 'Stars & Clouds', stickers: ['⭐', '🌟', '☁️', '🌙', '☀️', '✨', '💫', '🌤️'] },
  { name: 'Food & Drinks', stickers: ['🍓', '🍰', '🍩', '🍕', '🧋', '🍉', '🍪', '🍦'] },
  { name: 'Emojis', stickers: ['😊', '😍', '🥳', '😎', '🥰', '🤩', '😇', '😋'] },
  { name: 'Fantasy & Magic', stickers: ['🦄', '🧚', '🪄', '🐉', '🔮', '🧜‍♀️', '🪷', '💎'] },
  { name: 'Decorative Shapes', stickers: ['💠', '🔶', '🔷', '🔺', '💟', '✴️', '🎀', '🪩'] },
]

const fonts = ['Inter, sans-serif', 'Georgia, serif', '"Trebuchet MS", sans-serif', 'cursive']

const backgrounds = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'Lavender', value: 'solid', color: '#eee8ff' },
  { name: 'Peach', value: 'solid', color: '#fff0e8' },
  { name: 'Mint', value: 'solid', color: '#e8fff5' },
  { name: 'Gradient', value: 'gradient' },
  { name: 'Confetti', value: 'confetti' },
]

function makeSticker(value, kind = 'emoji', index = 0) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    value,
    kind,
    x: WIDTH / 2 + ((index % 3) - 1) * 55,
    y: HEIGHT / 2 + (index % 2 ? 40 : -35),
    size: kind === 'text' ? 240 : 124,
    rotation: 0,
    color: ['#fff0f6', '#fff7d6', '#e7f8ff', '#e9ffe9', '#f0e9ff'][index % 5],
    textColor: '#7c3aed',
    outline: '#ffffff',
    opacity: 1,
    font: fonts[0],
  }
}

function drawScene(ctx, objects, background, selectedId = null, scale = 1) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  const option = backgrounds.find((item) => item.name === background)

  if (option?.value === 'solid') {
    ctx.fillStyle = option.color
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
  } else if (option?.value === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
    gradient.addColorStop(0, '#f3e8ff')
    gradient.addColorStop(0.52, '#ffe4f2')
    gradient.addColorStop(1, '#ffedd5')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
  } else if (option?.value === 'confetti') {
    ctx.fillStyle = '#fffafd'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    const colors = ['#d8b4fe', '#f9a8d4', '#fdba74', '#86efac', '#7dd3fc']
    for (let index = 0; index < 70; index += 1) {
      ctx.globalAlpha = 0.6
      ctx.fillStyle = colors[index % colors.length]
      ctx.beginPath()
      ctx.arc((index * 137 + 29) % WIDTH, (index * 89 + 43) % HEIGHT, 3 + (index % 4), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  objects.forEach((item) => {
    ctx.save()
    ctx.globalAlpha = item.opacity ?? 1
    ctx.translate(item.x, item.y)
    ctx.rotate((item.rotation * Math.PI) / 180)
    ctx.shadowColor = 'rgba(57, 34, 86, 0.2)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 5

    if (item.kind === 'text') {
      const boxWidth = item.size
      const boxHeight = 100
      ctx.fillStyle = item.color
      ctx.strokeStyle = item.outline
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 28)
      ctx.fill()
      ctx.stroke()
      ctx.shadowColor = 'transparent'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `800 38px ${item.font || fonts[0]}`
      ctx.lineJoin = 'round'
      ctx.lineWidth = 6
      ctx.strokeStyle = item.outline
      ctx.strokeText(item.value, 0, 0, boxWidth - 32)
      ctx.fillStyle = item.textColor
      ctx.fillText(item.value, 0, 0, boxWidth - 32)
    } else {
      ctx.beginPath()
      ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = item.color
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = item.outline
      ctx.lineWidth = 4
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${item.size * 0.62}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
      ctx.fillText(item.value, 0, 1)
    }
    ctx.restore()

    if (item.id === selectedId) {
      ctx.save()
      ctx.translate(item.x, item.y)
      ctx.rotate((item.rotation * Math.PI) / 180)
      const boxWidth = item.kind === 'text' ? item.size : item.size + 10
      const boxHeight = item.kind === 'text' ? 110 : item.size + 10
      ctx.setLineDash([6, 5])
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 2
      ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight)
      ctx.setLineDash([])
      ctx.fillStyle = '#8b5cf6'
      ctx.beginPath()
      ctx.arc(boxWidth / 2, boxHeight / 2, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  })
}

function StickerStudio({ onSaveSticker }) {
  const canvasRef = useRef(null)
  const interactionRef = useRef(null)
  const [objects, setObjects] = useState([])
  const [background, setBackground] = useState('Transparent')
  const [selectedId, setSelectedId] = useState(null)
  const [category, setCategory] = useState(categories[0].name)
  const [stickerChoice, setStickerChoice] = useState(categories[0].stickers[0])
  const [text, setText] = useState('Hello, sunshine!')
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const objectsRef = useRef(objects)

  useEffect(() => {
    objectsRef.current = objects
  }, [objects])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    function render() {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * ratio)
      canvas.height = Math.round(rect.height * ratio)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawScene(ctx, objectsRef.current, background, selectedId, (rect.width * ratio) / WIDTH)
    }

    render()
    const observer = new ResizeObserver(render)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [objects, background, selectedId])

  const selected = objects.find((item) => item.id === selectedId) || null
  const activeCategory = categories.find((item) => item.name === category)

  function commit(nextObjects) {
    setHistory((previous) => [...previous.slice(-39), objectsRef.current])
    setFuture([])
    objectsRef.current = nextObjects
    setObjects(nextObjects)
  }

  function addSticker() {
    const next = makeSticker(stickerChoice, 'emoji', objects.length)
    commit([...objects, next])
    setSelectedId(next.id)
  }

  function addTextSticker() {
    if (!text.trim()) return
    const next = makeSticker(text.trim().slice(0, 28), 'text', objects.length)
    commit([...objects, next])
    setSelectedId(next.id)
  }

  function updateSelected(changes) {
    commit(objects.map((item) => item.id === selectedId ? { ...item, ...changes } : item))
  }

  function undo() {
    if (!history.length) return
    setFuture((previous) => [objectsRef.current, ...previous])
    const nextHistory = [...history]
    const previous = nextHistory.pop()
    setHistory(nextHistory)
    objectsRef.current = previous
    setObjects(previous)
    setSelectedId(null)
  }

  function redo() {
    if (!future.length) return
    const [next, ...remaining] = future
    setHistory((previous) => [...previous, objectsRef.current])
    setFuture(remaining)
    objectsRef.current = next
    setObjects(next)
    setSelectedId(null)
  }

  function pointFromEvent(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    }
  }

  function toLocal(item, point) {
    const angle = (-item.rotation * Math.PI) / 180
    const dx = point.x - item.x
    const dy = point.y - item.y
    return {
      x: dx * Math.cos(angle) - dy * Math.sin(angle),
      y: dx * Math.sin(angle) + dy * Math.cos(angle),
    }
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return
    const point = pointFromEvent(event)
    const topItem = [...objects].reverse().find((item) => {
      const local = toLocal(item, point)
      const halfWidth = (item.kind === 'text' ? item.size : item.size + 10) / 2
      const halfHeight = (item.kind === 'text' ? 110 : item.size + 10) / 2
      return Math.abs(local.x) <= halfWidth && Math.abs(local.y) <= halfHeight
    })

    if (!topItem) {
      setSelectedId(null)
      return
    }
    setSelectedId(topItem.id)
    const local = toLocal(topItem, point)
    const handle = topItem.kind === 'text' ? topItem.size / 2 : topItem.size / 2 + 5
    const resizing = local.x > handle - 20 && local.y > handle - 20
    interactionRef.current = {
      id: topItem.id,
      mode: resizing ? 'resize' : 'move',
      start: point,
      original: { x: topItem.x, y: topItem.y, size: topItem.size },
      before: objectsRef.current,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    const interaction = interactionRef.current
    if (!interaction) return
    const point = pointFromEvent(event)
    const dx = point.x - interaction.start.x
    const dy = point.y - interaction.start.y
    const updated = objectsRef.current.map((item) => {
      if (item.id !== interaction.id) return item
      if (interaction.mode === 'resize') {
        return { ...item, size: Math.max(item.kind === 'text' ? 145 : 64, Math.min(350, interaction.original.size + Math.max(dx, dy))) }
      }
      return {
        ...item,
        x: Math.max(50, Math.min(WIDTH - 50, interaction.original.x + dx)),
        y: Math.max(50, Math.min(HEIGHT - 50, interaction.original.y + dy)),
      }
    })
    objectsRef.current = updated
    setObjects(updated)
  }

  function finishPointerAction() {
    const interaction = interactionRef.current
    if (!interaction) return
    interactionRef.current = null
    const updatedItem = objectsRef.current.find((item) => item.id === interaction.id)
    if (updatedItem && (
      Math.abs(updatedItem.x - interaction.original.x) > 1
      || Math.abs(updatedItem.y - interaction.original.y) > 1
      || Math.abs(updatedItem.size - interaction.original.size) > 1
    )) {
      setHistory((previous) => [...previous.slice(-39), interaction.before])
      setFuture([])
    }
  }

  function moveSelected(direction) {
    if (!selected) return
    const index = objects.findIndex((item) => item.id === selected.id)
    const target = direction === 'front' ? Math.min(objects.length - 1, index + 1) : Math.max(0, index - 1)
    if (target === index) return
    const next = [...objects]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }

  function duplicateSelected() {
    if (!selected) return
    const duplicate = { ...selected, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, x: selected.x + 32, y: selected.y + 32 }
    commit([...objects, duplicate])
    setSelectedId(duplicate.id)
  }

  function deleteSelected() {
    if (!selected) return
    commit(objects.filter((item) => item.id !== selectedId))
    setSelectedId(null)
  }

  function resetCanvas() {
    commit([])
    setSelectedId(null)
  }

  function exportPng() {
    const canvas = document.createElement('canvas')
    const ratio = 2
    canvas.width = WIDTH * ratio
    canvas.height = HEIGHT * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      alert('Unable to prepare the sticker PNG.')
      return
    }
    drawScene(ctx, objects, background, null, ratio)
    const link = document.createElement('a')
    link.download = 'pixelalchemy-stickers.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function saveToGallery() {
    if (!objects.length) return
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH * 2
    canvas.height = HEIGHT * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      alert('Unable to prepare the sticker design for your Gallery.')
      return
    }
    drawScene(ctx, objects, background, null, 2)
    onSaveSticker(canvas.toDataURL('image/png'))
  }

  return (
    <section className="sticker-studio">
      <header className="sticker-welcome">
        <div>
          <p className="eyebrow">YOUR STICKER PLAYGROUND</p>
          <h1>Little things, <span>big personality.</span></h1>
          <p className="welcome-description">Pick your favorites, layer them together, and make something wonderfully yours.</p>
        </div>
        <div className="sticker-welcome-mark">✦ &nbsp; MADE BY YOU</div>
      </header>

      <div className="sticker-workspace">
        <aside className="sticker-panel sticker-library">
          <div className="sticker-section-heading">
            <p className="eyebrow">PICK YOUR VIBE</p>
            <h2>Sticker library</h2>
          </div>
          <div className="sticker-categories">
            {categories.map((item) => (
              <button
                type="button"
                key={item.name}
                className={category === item.name ? 'active' : ''}
                onClick={() => { setCategory(item.name); setStickerChoice(item.stickers[0]) }}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="sticker-picker">
            {activeCategory.stickers.map((emoji, index) => (
              <button
                type="button"
                key={`${emoji}-${index}`}
                className={stickerChoice === emoji ? 'active' : ''}
                onClick={() => setStickerChoice(emoji)}
                aria-label={`Choose ${emoji} sticker`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button type="button" className="sticker-primary-button" onClick={addSticker}>＋ Add sticker</button>
          <div className="sticker-text-form">
            <label htmlFor="custom-sticker-text">Create a text sticker</label>
            <input id="custom-sticker-text" value={text} maxLength={28} onChange={(event) => setText(event.target.value)} />
            <button type="button" onClick={addTextSticker}>＋ Add your text</button>
          </div>
        </aside>

        <section className="sticker-canvas-panel">
          <div className="sticker-canvas-toolbar">
            <span><i /> DESIGN CANVAS</span>
            <div>
              <button type="button" onClick={undo} disabled={!history.length} title="Undo"><Undo2 size={16} /><span>Undo</span></button>
              <button type="button" onClick={redo} disabled={!future.length} title="Redo"><Redo2 size={16} /><span>Redo</span></button>
              <button type="button" onClick={duplicateSelected} disabled={!selected} title="Duplicate"><Copy size={15} /><span>Copy</span></button>
              <button type="button" onClick={deleteSelected} disabled={!selected} title="Delete"><Trash2 size={15} /><span>Delete</span></button>
            </div>
          </div>
          <div className={`sticker-canvas-frame ${background === 'Transparent' ? 'transparent' : ''}`}>
            <canvas
              ref={canvasRef}
              className="sticker-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPointerAction}
              onPointerCancel={finishPointerAction}
              aria-label="Sticker design canvas. Drag a sticker to move it; drag its corner to resize."
            />
            {objects.length === 0 && <div className="sticker-empty-canvas"><span>✿</span><strong>Your canvas is ready</strong><small>Choose a sticker on the left to get started</small></div>}
          </div>
          <div className="sticker-canvas-footer">
            <span>Drag to move · Pull the corner handle to resize</span>
            <div>
              <button type="button" onClick={exportPng}><Download size={15} /> Download PNG</button>
              <button type="button" className="save" onClick={saveToGallery} disabled={!objects.length}><Save size={15} /> Save to Gallery</button>
            </div>
          </div>
        </section>

        <aside className="sticker-panel sticker-editor">
          <div className="sticker-section-heading">
            <p className="eyebrow">MAKE IT YOURS</p>
            <h2>Design settings</h2>
          </div>
          <div className="sticker-control">
            <label htmlFor="sticker-background">Canvas background</label>
            <select id="sticker-background" value={background} onChange={(event) => setBackground(event.target.value)}>
              {backgrounds.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </div>
          {selected ? (
            <>
              <div className="sticker-control">
                <label htmlFor="sticker-color">Sticker color</label>
                <div className="sticker-color-input">
                  <input id="sticker-color" type="color" value={selected.color} onChange={(event) => updateSelected({ color: event.target.value })} />
                  <span>{selected.color.toUpperCase()}</span>
                </div>
              </div>
              {selected.kind === 'text' && (
                <>
                  <div className="sticker-control">
                    <label htmlFor="sticker-text-color">Text color</label>
                    <div className="sticker-color-input">
                      <input id="sticker-text-color" type="color" value={selected.textColor} onChange={(event) => updateSelected({ textColor: event.target.value })} />
                      <span>{selected.textColor.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="sticker-control">
                    <label htmlFor="sticker-font">Text font</label>
                    <select id="sticker-font" value={selected.font || fonts[0]} onChange={(event) => updateSelected({ font: event.target.value })}>
                      {fonts.map((font) => <option key={font} value={font}>{font.split(',')[0].replaceAll('"', '')}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="sticker-control">
                <label htmlFor="sticker-outline">Outline color</label>
                <div className="sticker-color-input">
                  <input id="sticker-outline" type="color" value={selected.outline} onChange={(event) => updateSelected({ outline: event.target.value })} />
                  <span>{selected.outline.toUpperCase()}</span>
                </div>
              </div>
              <div className="sticker-control">
                <div className="sticker-slider-heading"><label htmlFor="sticker-opacity">Opacity</label><span>{Math.round((selected.opacity ?? 1) * 100)}%</span></div>
                <input id="sticker-opacity" type="range" min="10" max="100" value={Math.round((selected.opacity ?? 1) * 100)} onChange={(event) => updateSelected({ opacity: Number(event.target.value) / 100 })} />
              </div>
              <div className="sticker-control">
                <div className="sticker-slider-heading"><label htmlFor="sticker-rotation">Rotation</label><span>{selected.rotation}°</span></div>
                <input id="sticker-rotation" type="range" min="-180" max="180" value={selected.rotation} onChange={(event) => updateSelected({ rotation: Number(event.target.value) })} />
              </div>
              <div className="sticker-control">
                <div className="sticker-slider-heading"><label htmlFor="sticker-size">Size</label><span>{selected.size}px</span></div>
                <input id="sticker-size" type="range" min={selected.kind === 'text' ? 145 : 64} max="350" value={selected.size} onChange={(event) => updateSelected({ size: Number(event.target.value) })} />
              </div>
              <div className="sticker-layer-controls">
                <button type="button" onClick={() => moveSelected('back')}>Send backward</button>
                <button type="button" onClick={() => moveSelected('front')}>Bring forward</button>
              </div>
            </>
          ) : (
            <div className="sticker-no-selection"><span>✧</span><p>Select an item on your canvas to adjust its color, size, and rotation.</p></div>
          )}
          <div className="sticker-reset"><button type="button" onClick={resetCanvas}><RotateCcw size={14} /> Clear canvas</button></div>
        </aside>
      </div>
    </section>
  )
}

export default StickerStudio
