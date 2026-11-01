// PixelAlchemy - Artwork Generator
// Generates four different creative patterns using HTML Canvas.

export const palettes = {
  purple: ['#a855f7', '#ec4899', '#f0abfc', '#7c3aed', '#ffffff'],
  orange: ['#fb923c', '#f97316', '#facc15', '#ef4444', '#ffffff'],
  blue: ['#38bdf8', '#6366f1', '#22d3ee', '#818cf8', '#ffffff'],
  green: ['#4ade80', '#2dd4bf', '#a3e635', '#14b8a6', '#ffffff'],
  pink: ['#f472b6', '#fb7185', '#e879f9', '#f9a8d4', '#ffffff'],
}

export function drawArtwork(ctx, width, height, settings = {}) {
  const {
    pattern = 'Bloom',
    palette = 'purple',
    complexity = 65,
    shapeSize = 45,
    artworkNumber = 1,
  } = settings

  const colors = palettes[palette] || palettes.purple

  // Prepare the canvas background.
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#100d1b'
  ctx.fillRect(0, 0, width, height)

  // Select the requested artwork pattern.
  switch (pattern) {
    case 'Spiral':
      drawSpiral(ctx, width, height, colors, complexity, shapeSize)
      break

    case 'Waves':
      drawWaves(ctx, width, height, colors, complexity, shapeSize)
      break

    case 'Particles':
      drawParticles(
        ctx,
        width,
        height,
        colors,
        complexity,
        shapeSize,
        artworkNumber
      )
      break

    case 'Bloom':
    default:
      drawBloom(ctx, width, height, colors, complexity, shapeSize)
      break
  }
}

// Pattern 1: Bloom
function drawBloom(ctx, width, height, colors, complexity, shapeSize) {
  const centerX = width / 2
  const centerY = height / 2
  const baseRadius = 35 + shapeSize * 1.1
  const petals = Math.max(6, Math.round(complexity * 0.65))

  ctx.save()
  ctx.translate(centerX, centerY)

  // Draw the glowing center.
  const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, baseRadius * 2)
  glow.addColorStop(0, `${colors[0]}55`)
  glow.addColorStop(1, '#100d1b00')

  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(0, 0, baseRadius * 2, 0, Math.PI * 2)
  ctx.fill()

  // Draw the petals.
  for (let i = 0; i < petals; i++) {
    const angle = (Math.PI * 2 * i) / petals

    ctx.save()
    ctx.rotate(angle)

    ctx.beginPath()
    ctx.ellipse(
      0,
      -baseRadius * 0.65,
      Math.max(5, shapeSize * 0.32),
      baseRadius * 0.85,
      0,
      0,
      Math.PI * 2
    )

    ctx.fillStyle = colors[i % colors.length] + 'bb'
    ctx.fill()

    ctx.strokeStyle = colors[i % colors.length]
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.restore()
  }

  // Draw the inner circle.
  ctx.beginPath()
  ctx.arc(0, 0, Math.max(8, shapeSize * 0.25), 0, Math.PI * 2)
  ctx.fillStyle = colors[4]
  ctx.fill()

  ctx.restore()
}

// Pattern 2: Spiral
function drawSpiral(ctx, width, height, colors, complexity, shapeSize) {
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.min(width, height) * 0.43
  const points = Math.max(100, complexity * 12)

  ctx.save()
  ctx.translate(centerX, centerY)

  for (let i = 0; i < points; i++) {
    const angle = i * 0.12
    const radius = (i / points) * maxRadius

    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    ctx.beginPath()
    ctx.arc(
      x,
      y,
      Math.max(1.5, (shapeSize / 18) * (1 - i / points) + 1),
      0,
      Math.PI * 2
    )

    ctx.fillStyle = colors[i % colors.length]
    ctx.fill()
  }

  ctx.restore()
}

// Pattern 3: Waves
function drawWaves(ctx, width, height, colors, complexity, shapeSize) {
  const lines = Math.max(5, Math.round(complexity / 3))
  const amplitude = 10 + shapeSize * 0.45
  const frequency = 0.018 + complexity * 0.00025

  for (let line = 0; line < lines; line++) {
    ctx.beginPath()

    const baseY = (height / (lines + 1)) * (line + 1)
    const phase = line * 0.45

    for (let x = 0; x <= width; x += 3) {
      const y =
        baseY +
        Math.sin(x * frequency + phase) * amplitude +
        Math.cos(x * frequency * 0.6 + phase) * amplitude * 0.45

      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.strokeStyle = colors[line % colors.length]
    ctx.lineWidth = 1 + (line % 3) * 0.5
    ctx.globalAlpha = 0.45 + (line % 4) * 0.12
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

// Pattern 4: Particles
function drawParticles(
  ctx,
  width,
  height,
  colors,
  complexity,
  shapeSize,
  artworkNumber
) {
  const count = Math.max(20, complexity * 3)
  const maxRadius = Math.max(2, shapeSize / 12)

  // Keep the particle layout stable for this artwork, independent of palette.
  let seed = Math.abs(Math.trunc(artworkNumber)) % 2147483646 + 1

  function random() {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  const particles = []

  for (let i = 0; i < count; i++) {
    particles.push({
      x: random() * width,
      y: random() * height,
      radius: 1 + random() * maxRadius,
    })
  }

  // Draw connecting lines between nearby particles.
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i]
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 85) {
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = colors[(i + j) % colors.length]
        ctx.globalAlpha = 0.12
        ctx.lineWidth = 0.7
        ctx.stroke()
      }
    }
  }

  ctx.globalAlpha = 1

  // Draw the particles.
  particles.forEach((particle, index) => {
    const color = colors[index % colors.length]

    ctx.beginPath()
    ctx.arc(
      particle.x,
      particle.y,
      particle.radius,
      0,
      Math.PI * 2
    )

    ctx.fillStyle = color
    ctx.shadowBlur = 12
    ctx.shadowColor = color
    ctx.fill()
  })

  ctx.shadowBlur = 0
}