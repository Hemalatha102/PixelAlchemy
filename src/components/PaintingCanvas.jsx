import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

const CANVAS_BACKGROUND = '#fffdfa'

function paintStroke(ctx, stroke, width, height) {
  const points = stroke.points
  if (!points.length) return

  const color = stroke.tool === 'eraser' ? CANVAS_BACKGROUND : stroke.color
  const alpha = stroke.tool === 'pencil' ? 0.72 : 1

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = stroke.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (points.length === 1) {
    ctx.beginPath()
    ctx.arc(
      points[0].x * width,
      points[0].y * height,
      stroke.size / 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(points[0].x * width, points[0].y * height)

    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x * width, points[index].y * height)
    }

    ctx.stroke()
  }

  ctx.restore()
}

const PaintingCanvas = forwardRef(function PaintingCanvas(
  { color, brushSize, tool, onHistoryChange },
  ref
) {
  const canvasRef = useRef(null)
  const actionsRef = useRef([])
  const cursorRef = useRef(0)
  const currentStrokeRef = useRef(null)
  const settingsRef = useRef({ color, brushSize, tool })
  const historyCallbackRef = useRef(onHistoryChange)

  settingsRef.current = { color, brushSize, tool }
  historyCallbackRef.current = onHistoryChange

  const reportHistory = useCallback(() => {
    const actions = actionsRef.current.slice(0, cursorRef.current)
    let hasContent = false

    for (const action of actions) {
      hasContent = action.type !== 'clear'
    }

    historyCallbackRef.current?.({
      canUndo: cursorRef.current > 0,
      canRedo: cursorRef.current < actionsRef.current.length,
      hasContent,
    })
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const pixelRatio = window.devicePixelRatio || 1
    const pixelWidth = Math.round(rect.width * pixelRatio)
    const pixelHeight = Math.round(rect.height * pixelRatio)

    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx.fillStyle = CANVAS_BACKGROUND
    ctx.fillRect(0, 0, rect.width, rect.height)

    for (const action of actionsRef.current.slice(0, cursorRef.current)) {
      if (action.type === 'clear') {
        ctx.fillStyle = CANVAS_BACKGROUND
        ctx.fillRect(0, 0, rect.width, rect.height)
      } else {
        paintStroke(ctx, action.stroke, rect.width, rect.height)
      }
    }

    if (currentStrokeRef.current) {
      paintStroke(ctx, currentStrokeRef.current, rect.width, rect.height)
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      undo() {
        if (cursorRef.current === 0) return
        cursorRef.current -= 1
        redrawCanvas()
        reportHistory()
      },
      redo() {
        if (cursorRef.current >= actionsRef.current.length) return
        cursorRef.current += 1
        redrawCanvas()
        reportHistory()
      },
      clear() {
        const actions = actionsRef.current.slice(0, cursorRef.current)
        let hasContent = false

        for (const action of actions) {
          hasContent = action.type !== 'clear'
        }

        if (!hasContent) return

        actionsRef.current = actions
        actionsRef.current.push({ type: 'clear' })
        cursorRef.current = actionsRef.current.length
        redrawCanvas()
        reportHistory()
      },
      toDataURL() {
        return canvasRef.current?.toDataURL('image/png') ?? null
      },
    }),
    [redrawCanvas, reportHistory]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    redrawCanvas()

    const resizeObserver = new ResizeObserver(redrawCanvas)
    resizeObserver.observe(canvas)

    return () => resizeObserver.disconnect()
  }, [redrawCanvas])

  function getPoint(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    }
  }

  function drawSegment(stroke, from, to) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const color = stroke.tool === 'eraser' ? CANVAS_BACKGROUND : stroke.color

    ctx.save()
    ctx.globalAlpha = stroke.tool === 'pencil' ? 0.72 : 1
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()

    if (from) {
      ctx.moveTo(from.x * rect.width, from.y * rect.height)
      ctx.lineTo(to.x * rect.width, to.y * rect.height)
      ctx.stroke()
    } else {
      ctx.arc(to.x * rect.width, to.y * rect.height, stroke.size / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const settings = settingsRef.current
    const point = getPoint(event)
    const stroke = {
      tool: settings.tool,
      color: settings.color,
      size: Number(settings.brushSize),
      points: [point],
    }

    currentStrokeRef.current = stroke
    drawSegment(stroke, null, point)
  }

  function handlePointerMove(event) {
    const stroke = currentStrokeRef.current
    if (!stroke) return

    event.preventDefault()
    const nativeEvent = event.nativeEvent
    const pointerEvents =
      typeof nativeEvent.getCoalescedEvents === 'function'
        ? nativeEvent.getCoalescedEvents()
        : [nativeEvent]

    for (const pointerEvent of pointerEvents) {
      const point = getPoint(pointerEvent)
      const previousPoint = stroke.points[stroke.points.length - 1]
      stroke.points.push(point)
      drawSegment(stroke, previousPoint, point)
    }
  }

  function finishStroke() {
    const stroke = currentStrokeRef.current
    if (!stroke) return

    currentStrokeRef.current = null
    actionsRef.current = actionsRef.current.slice(0, cursorRef.current)
    actionsRef.current.push({ type: 'stroke', stroke })
    cursorRef.current = actionsRef.current.length
    reportHistory()
  }

  return (
    <canvas
      ref={canvasRef}
      className="painting-canvas"
      aria-label="Painting canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
    />
  )
})

export default PaintingCanvas
