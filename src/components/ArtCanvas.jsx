import { useEffect, useRef } from 'react'
import { drawArtwork } from '../utils/artGenerators'

function ArtCanvas({
  pattern = 'Bloom',
  palette = 'purple',
  complexity = 65,
  shapeSize = 45,
  artworkNumber = 1,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = canvas.parentElement
    if (!container) return

    const draw = () => {
      const rect = container.getBoundingClientRect()

      if (!rect.width || !rect.height) return

      const pixelRatio = window.devicePixelRatio || 1
      const canvasWidth = Math.round(rect.width * pixelRatio)
      const canvasHeight = Math.round(rect.height * pixelRatio)

      if (canvas.width !== canvasWidth) canvas.width = canvasWidth
      if (canvas.height !== canvasHeight) canvas.height = canvasHeight

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      drawArtwork(ctx, rect.width, rect.height, {
        pattern,
        palette,
        complexity,
        shapeSize,
        artworkNumber,
      })
    }

    draw()

    const resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [pattern, palette, complexity, shapeSize, artworkNumber])

  return (
    <canvas
      ref={canvasRef}
      className="artwork-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-label={`Generated ${pattern} artwork`}
      role="img"
    />
  )
}

export default ArtCanvas