import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  Brush,
  Download,
  Eraser,
  Palette,
  Pencil,
  Redo2,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react'
import ArtCanvas from './components/ArtCanvas'
import PaintingCanvas from './components/PaintingCanvas'
import './App.css'

const ThreeDArtStudio = lazy(() => import('./components/ThreeDArtStudio'))

const patterns = [
  { name: 'Bloom', icon: '✺' },
  { name: 'Spiral', icon: '◎' },
  { name: 'Waves', icon: '〰' },
  { name: 'Particles', icon: '⁙' },
]

const palettes = [
  { name: 'purple', color: '#a855f7' },
  { name: 'orange', color: '#fb923c' },
  { name: 'blue', color: '#38bdf8' },
  { name: 'green', color: '#4ade80' },
  { name: 'pink', color: '#f472b6' },
]

const paintingColors = [
  '#1f2937',
  '#7c3aed',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#0ea5e9',
]

function PaintingStudio({ onSavePainting }) {
  const paintingCanvasRef = useRef(null)
  const [tool, setTool] = useState('brush')
  const [color, setColor] = useState('#7c3aed')
  const [brushSize, setBrushSize] = useState(8)
  const [history, setHistory] = useState({
    canUndo: false,
    canRedo: false,
    hasContent: false,
  })

  function downloadPainting() {
    const image = paintingCanvasRef.current?.toDataURL()
    if (!image) {
      alert('Painting canvas is not available yet.')
      return
    }

    const link = document.createElement('a')
    link.download = 'pixelalchemy-painting.png'
    link.href = image
    link.click()
  }

  function savePainting() {
    const image = paintingCanvasRef.current?.toDataURL()
    if (!image) {
      alert('Painting canvas is not available yet.')
      return
    }

    onSavePainting(image)
  }

  return (
    <>
      <section className="welcome-section painting-welcome">
        <div>
          <p className="eyebrow">YOUR DIGITAL CANVAS</p>
          <h1>
            Paint your <span>own story.</span>
          </h1>
          <p className="welcome-description">
            Sketch freely, experiment with color, and save your finished work
            to your Gallery.
          </p>
        </div>
      </section>

      <section className="workspace painting-workspace">
        <div className="canvas-panel painting-panel">
          <div className="panel-header">
            <div>
              <span className="status-dot"></span>
              <span>PAINTING STUDIO</span>
            </div>
            <span className="canvas-label">FREEHAND CANVAS</span>
          </div>

          <div className="painting-actions">
            <div className="painting-history-actions">
              <button
                className="painting-icon-button"
                onClick={() => paintingCanvasRef.current?.undo()}
                disabled={!history.canUndo}
                aria-label="Undo"
                title="Undo"
              >
                <Undo2 size={17} />
                <span>Undo</span>
              </button>
              <button
                className="painting-icon-button"
                onClick={() => paintingCanvasRef.current?.redo()}
                disabled={!history.canRedo}
                aria-label="Redo"
                title="Redo"
              >
                <Redo2 size={17} />
                <span>Redo</span>
              </button>
              <button
                className="painting-icon-button"
                onClick={() => paintingCanvasRef.current?.clear()}
                disabled={!history.hasContent}
                aria-label="Clear canvas"
                title="Clear canvas"
              >
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            </div>

            <div className="painting-save-actions">
              <button className="painting-secondary-button" onClick={downloadPainting}>
                <Download size={16} />
                Download PNG
              </button>
              <button className="painting-primary-button" onClick={savePainting}>
                <Save size={16} />
                Save to Gallery
              </button>
            </div>
          </div>

          <div className="painting-canvas-frame">
            <PaintingCanvas
              ref={paintingCanvasRef}
              color={color}
              brushSize={brushSize}
              tool={tool}
              onHistoryChange={setHistory}
            />
          </div>

          <div className="painting-canvas-footer">
            <span>Draw with your mouse, pen, or touch</span>
            <span>{tool === 'eraser' ? 'Eraser' : `${brushSize}px ${tool}`}</span>
          </div>
        </div>

        <aside className="control-panel painting-controls">
          <div className="control-heading">
            <div>
              <p className="eyebrow">MAKE IT YOURS</p>
              <h2>Brush settings</h2>
            </div>
            <Palette size={22} />
          </div>

          <div className="control-group">
            <label>Choose a tool</label>
            <div className="painting-tool-list">
              <button
                className={`painting-tool ${tool === 'brush' ? 'selected' : ''}`}
                onClick={() => setTool('brush')}
                aria-pressed={tool === 'brush'}
              >
                <Brush size={18} />
                Brush
              </button>
              <button
                className={`painting-tool ${tool === 'pencil' ? 'selected' : ''}`}
                onClick={() => setTool('pencil')}
                aria-pressed={tool === 'pencil'}
              >
                <Pencil size={18} />
                Pencil
              </button>
              <button
                className={`painting-tool ${tool === 'eraser' ? 'selected' : ''}`}
                onClick={() => setTool('eraser')}
                aria-pressed={tool === 'eraser'}
              >
                <Eraser size={18} />
                Eraser
              </button>
            </div>
          </div>

          <div className="control-group">
            <div className="painting-color-heading">
              <label htmlFor="painting-color">Brush color</label>
              <span>{color.toUpperCase()}</span>
            </div>
            <div className="painting-color-options">
              {paintingColors.map((swatch) => (
                <button
                  key={swatch}
                  className={`painting-color-swatch ${
                    color === swatch ? 'selected' : ''
                  }`}
                  style={{ backgroundColor: swatch }}
                  onClick={() => setColor(swatch)}
                  aria-label={`Set brush color to ${swatch}`}
                  aria-pressed={color === swatch}
                />
              ))}
              <label
                className="painting-custom-color"
                htmlFor="painting-color"
                title="Choose a custom color"
              >
                +
              </label>
              <input
                id="painting-color"
                className="painting-color-input"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                aria-label="Choose a custom brush color"
              />
            </div>
          </div>

          <div className="control-group">
            <div className="slider-label">
              <label htmlFor="brush-size">Brush size</label>
              <span>{brushSize}px</span>
            </div>
            <input
              id="brush-size"
              type="range"
              min="1"
              max="48"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            />
          </div>

          <div className="painting-tip">
            <span>✦</span>
            <p>Your strokes stay in place when you change tools, colors, or size.</p>
          </div>
        </aside>
      </section>

      <section className="inspiration-section">
        <div>
          <span className="inspiration-icon">✧</span>
          <div>
            <h3>Every line is yours.</h3>
            <p>Undo, redo, and keep experimenting until it feels right.</p>
          </div>
        </div>
        <span className="version-label">PIXELALCHEMY PAINTING STUDIO</span>
      </section>
    </>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('Pattern Studio')

  const [pattern, setPattern] = useState('Bloom')
  const [palette, setPalette] = useState('purple')
  const [complexity, setComplexity] = useState(65)
  const [shapeSize, setShapeSize] = useState(45)
  const [artworkNumber, setArtworkNumber] = useState(1)

  const [gallery, setGallery] = useState(() => {
    try {
      const savedArtwork = localStorage.getItem('pixelalchemy-gallery')
      return savedArtwork ? JSON.parse(savedArtwork) : []
    } catch (error) {
      console.error('Unable to load saved artwork:', error)
      return []
    }
  })

  const [paintingNumber, setPaintingNumber] = useState(() => {
    const highestSavedNumber = gallery.reduce((highest, item) => {
      const match = /^Painting (\d+)$/.exec(item.name || '')
      return match ? Math.max(highest, Number(match[1])) : highest
    }, 0)

    return highestSavedNumber + 1
  })

  const [showPalettePicker, setShowPalettePicker] = useState(false)
  useEffect(() => {
  try {
    localStorage.setItem('pixelalchemy-gallery', JSON.stringify(gallery))
  } catch (error) {
    console.error('Unable to save artwork:', error)
    alert('Unable to save artwork. Your browser storage may be full.')
  }
}, [gallery])

  function generateArtwork() {
    setArtworkNumber((number) => number + 1)
  }

  function resetSettings() {
    setPattern('Bloom')
    setPalette('purple')
    setComplexity(65)
    setShapeSize(45)
  }

  function downloadArtwork() {
    const canvas = document.querySelector('.artwork-canvas')

    if (!canvas) {
      alert('Artwork canvas is not available yet.')
      return
    }

    const link = document.createElement('a')
    link.download = `pixelalchemy-${pattern.toLowerCase()}-${artworkNumber}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function saveToGallery() {
  const canvas = document.querySelector('.artwork-canvas')

  if (!canvas) {
    alert('Artwork canvas not found. Please generate artwork first.')
    return
  }

  try {
    const artwork = {
      id: Date.now(),
      name: `${pattern} Creation ${artworkNumber}`,
      type: 'Pattern',
      pattern,
      palette,
      image: canvas.toDataURL('image/png'),
    }

    setGallery((currentGallery) => [artwork, ...currentGallery])
    setActiveTab('Gallery')

    alert('Artwork saved successfully to your Gallery!')
  } catch (error) {
    console.error('Gallery save error:', error)
    alert('Unable to save artwork. Please check the browser console.')
  }
}

  function savePaintingToGallery(image) {
    const painting = {
      id: `painting-${Date.now()}-${paintingNumber}`,
      name: `Painting ${paintingNumber}`,
      type: 'Painting',
      image,
    }

    setGallery((currentGallery) => [painting, ...currentGallery])
    setPaintingNumber((number) => number + 1)
    setActiveTab('Gallery')
    alert('Painting saved successfully to your Gallery!')
  }

  function save3DSceneToGallery(image, scene) {
    const sceneCount = gallery.filter((item) => item.type === '3D Art').length
    const savedScene = {
      id: `3d-art-${Date.now()}`,
      name: `3D Creation ${sceneCount + 1}`,
      type: '3D Art',
      image,
      scene,
    }

    setGallery((currentGallery) => [savedScene, ...currentGallery])
    setActiveTab('Gallery')
    alert('3D artwork saved successfully to your Gallery!')
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">✳</span>
          <span>
            Pixel<span className="logo-highlight">Alchemy</span>
          </span>
        </div>

        <div className="nav-links">
          {['Pattern Studio', 'Painting Studio', '3D Art Studio', 'Gallery', 'About'].map((tab) => (
            <button
              key={tab}
              className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <button className="profile-button" aria-label="Profile">
          HA
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'Pattern Studio' && (
          <>
            <section className="welcome-section">
              <div>
                <p className="eyebrow">YOUR CREATIVE UNIVERSE</p>

                <h1>
                  Art without <span>boundaries.</span>
                </h1>

                <p className="welcome-description">
                  Turn imagination into digital masterpieces.
                  Explore colors, shapes, and endless creative possibilities.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={generateArtwork}
              >
                <Sparkles size={17} /> Create New Art
              </button>
            </section>

            <section className="workspace">
              <div className="canvas-panel">
                <div className="panel-header">
                  <div>
                    <span className="status-dot"></span>
                    <span>CREATIVE STUDIO</span>
                  </div>

                  <span className="canvas-label">LIVE PREVIEW</span>
                </div>

                <div className="artwork">
                  <ArtCanvas
                    pattern={pattern}
                    palette={palette}
                    complexity={complexity}
                    shapeSize={shapeSize}
                    artworkNumber={artworkNumber}
                  />
                </div>

                <div className="canvas-footer">
                  <div>
                    <h3>{pattern} Creation</h3>
                    <p>Generative art · Abstract geometry</p>
                  </div>

                  <button
                    className="download-button"
                    onClick={downloadArtwork}
                    title="Download artwork as PNG"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>

              <aside className="control-panel">
                <div className="control-heading">
                  <div>
                    <p className="eyebrow">CUSTOMIZE</p>
                    <h2>Art settings</h2>
                  </div>

                  <Palette size={22} />
                </div>

                <div className="control-group">
                  <label>Choose a pattern</label>

                  <div className="pattern-grid">
                    {patterns.map((item) => (
                      <button
                        key={item.name}
                        className={`pattern-card ${
                          pattern === item.name ? 'selected' : ''
                        }`}
                        onClick={() => setPattern(item.name)}
                      >
                        <span>{item.icon}</span>
                        <small>{item.name}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <label>Color palette</label>

                  <div className="color-palette">
                    {palettes.map((item) => (
                      <button
                        key={item.name}
                        className={`color-swatch color-${item.name} ${
                          palette === item.name ? 'selected-swatch' : ''
                        }`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => setPalette(item.name)}
                        aria-label={`${item.name} palette`}
                        title={`${item.name} palette`}
                      />
                    ))}

                    <button
                      className="add-color"
                      onClick={() => setShowPalettePicker((value) => !value)}
                      aria-label="Show palette information"
                      title="Palette information"
                    >
                      +
                    </button>
                  </div>

                  {showPalettePicker && (
                    <p className="palette-message">
                      Choose any color circle to change your artwork palette.
                    </p>
                  )}
                </div>

                <div className="control-group">
                  <div className="slider-label">
                    <label htmlFor="complexity">Complexity</label>
                    <span>{complexity}%</span>
                  </div>

                  <input
                    id="complexity"
                    type="range"
                    min="1"
                    max="100"
                    value={complexity}
                    onChange={(event) =>
                      setComplexity(Number(event.target.value))
                    }
                  />
                </div>

                <div className="control-group">
                  <div className="slider-label">
                    <label htmlFor="size">Shape size</label>
                    <span>{shapeSize}%</span>
                  </div>

                  <input
                    id="size"
                    type="range"
                    min="1"
                    max="100"
                    value={shapeSize}
                    onChange={(event) =>
                      setShapeSize(Number(event.target.value))
                    }
                  />
                </div>

                <button
                  className="generate-button"
                  onClick={generateArtwork}
                >
                  <Sparkles size={17} />
                  Generate Artwork
                </button>

                <button
                  className="reset-button"
                  onClick={resetSettings}
                >
                  <RotateCcw size={15} />
                  Reset settings
                </button>

                <button
                  className="reset-button"
                  onClick={saveToGallery}
                >
                  Save to Gallery
                </button>
              </aside>
            </section>

            <section className="inspiration-section">
              <div>
                <span className="inspiration-icon">✧</span>

                <div>
                  <h3>Creativity has no limits.</h3>
                  <p>
                    Experiment with patterns and discover your next masterpiece.
                  </p>
                </div>
              </div>

              <span className="version-label">
                PIXELALCHEMY STUDIO · V1.0
              </span>
            </section>
          </>
        )}

        <div hidden={activeTab !== 'Painting Studio'}>
          <PaintingStudio onSavePainting={savePaintingToGallery} />
        </div>

        {activeTab === '3D Art Studio' && (
          <Suspense fallback={<p className="welcome-description">Loading 3D Art Studio...</p>}>
            <ThreeDArtStudio onSaveScene={save3DSceneToGallery} />
          </Suspense>
        )}

        {activeTab === 'Gallery' && (
          <section className="page-section">
            <p className="eyebrow">YOUR CREATIVE COLLECTION</p>
            <h1>
              Art <span>Gallery.</span>
            </h1>
            <p className="welcome-description">
              Your saved creations appear here.
            </p>

            {gallery.length === 0 ? (
              <div className="empty-gallery">
                <span>✧</span>
                <h2>Your gallery is waiting.</h2>
                <p>Create artwork in the Studio and select Save to Gallery.</p>

                <button
                  className="generate-button"
                  onClick={() => setActiveTab('Pattern Studio')}
                >
                  Go to Pattern Studio
                </button>
              </div>
            ) : (
              <div className="gallery-grid">
                {gallery.map((item) => (
                  <article className="gallery-card" key={item.id}>
                    <img src={item.image} alt={item.name} />

                    <div>
                      <span
                        className={`gallery-type-badge ${
                          (item.type || 'Pattern') === 'Painting'
                            ? 'painting-badge'
                            : item.type === '3D Art'
                              ? 'three-art-badge'
                              : item.type === 'Sticker'
                                ? 'sticker-badge'
                              : 'pattern-badge'
                        }`}
                      >
                        {item.type || 'Pattern'}
                      </span>
                      <h3>{item.name}</h3>
                      <p>
                        {item.type === 'Painting'
                          ? 'Freehand painting'
                          : item.type === '3D Art'
                            ? `${item.scene?.objects?.length ?? 0} objects · 3D scene`
                            : item.type === 'Sticker'
                            ? 'Custom sticker design'
                            : `${item.pattern || 'Pattern'} · ${item.palette || 'purple'} palette`}
                      </p>

                      <button
                        className="reset-button"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = item.image
                          link.download = `${item.name.replaceAll(' ', '-')}.png`
                          link.click()
                        }}
                      >
                        <Download size={15} /> Download
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'About' && (
          <section className="page-section about-page">
            <p className="eyebrow">THE IDEA BEHIND THE ART</p>
            <h1>
              Meet <span>PixelAlchemy.</span>
            </h1>

            <p className="welcome-description">
              PixelAlchemy is a browser-based creative playground that turns
              simple settings into colorful generative artwork.
            </p>

            <div className="about-cards">
              <article>
                <span>✦</span>
                <h3>Creative Freedom</h3>
                <p>Explore patterns, palettes, and shapes to make art your way.</p>
              </article>

              <article>
                <span>◈</span>
                <h3>Canvas Powered</h3>
                <p>Artwork is drawn in your browser using the HTML Canvas API.</p>
              </article>

              <article>
                <span>⬡</span>
                <h3>Frontend Project</h3>
                <p>Built with React, JavaScript, HTML, and CSS—without a backend.</p>
              </article>
            </div>

            <button
              className="generate-button"
              onClick={() => setActiveTab('Pattern Studio')}
            >
              Start Creating
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App