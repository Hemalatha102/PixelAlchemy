import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  Download,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Copy,
} from 'lucide-react'
import * as THREE from 'three'
import './ThreeDArtStudio.css'

const OBJECT_TYPES = [
  { type: 'Cube', icon: '⬡' },
  { type: 'Sphere', icon: '●' },
  { type: 'Cylinder', icon: '▰' },
  { type: 'Cone', icon: '▲' },
  { type: 'Torus', icon: '◉' },
  { type: 'Pyramid', icon: '△' },
  { type: 'Heart', icon: '♥' },
  { type: 'Star', icon: '★' },
  { type: 'Custom', icon: '⬢' },
]

const MATERIALS = ['Glossy', 'Matte', 'Metallic', 'Glass']
const BACKGROUNDS = [
  { name: 'Cosmic', value: 'cosmic' },
  { name: 'Sunset', value: 'sunset' },
  { name: 'Ocean', value: 'ocean' },
  { name: 'Midnight', value: 'midnight' },
]

const DEFAULT_SCENE = {
  objects: [],
  background: 'cosmic',
}

function createObject(type, index) {
  const positions = [[0, 0, 0], [1.45, 0, 0], [0, 0, 1.45], [-1.45, 0, 0], [0, 0, -1.45]]
  const angle = (index - positions.length + 1) * 2.399963
  const radius = 2.25 + Math.floor((index - positions.length + 1) / 8) * 0.6

  return {
    id: `object-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    color: ['#a78bfa', '#f472b6', '#38bdf8', '#fb923c'][index % 4],
    material: 'Glossy',
    wireframe: false,
    position: index < positions.length
      ? [...positions[index]]
      : [
          THREE.MathUtils.clamp(Math.cos(angle) * radius, -3.2, 3.2),
          (index % 3) * 0.25,
          THREE.MathUtils.clamp(Math.sin(angle) * radius, -3.2, 3.2),
        ],
    rotation: [0, 0, 0],
    scale: 1,
  }
}

function createHeartGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, -0.55)
  shape.bezierCurveTo(-0.15, -0.4, -0.72, 0.02, -0.72, 0.38)
  shape.bezierCurveTo(-0.72, 0.85, -0.12, 0.86, 0, 0.48)
  shape.bezierCurveTo(0.12, 0.86, 0.72, 0.85, 0.72, 0.38)
  shape.bezierCurveTo(0.72, 0.02, 0.15, -0.4, 0, -0.55)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.07,
    bevelThickness: 0.07,
  })
  geometry.center()
  return geometry
}

function createStarGeometry() {
  const shape = new THREE.Shape()
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? 0.85 : 0.38
    const angle = (point / 10) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (point === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.06,
    bevelThickness: 0.05,
  })
  geometry.center()
  return geometry
}

function createGeometry(type) {
  switch (type) {
    case 'Sphere':
      return new THREE.SphereGeometry(0.85, 48, 32)
    case 'Cylinder':
      return new THREE.CylinderGeometry(0.66, 0.66, 1.6, 48)
    case 'Cone':
      return new THREE.ConeGeometry(0.82, 1.7, 48)
    case 'Torus':
      return new THREE.TorusGeometry(0.66, 0.27, 24, 72)
    case 'Pyramid':
      return new THREE.ConeGeometry(0.95, 1.65, 4)
    case 'Heart':
      return createHeartGeometry()
    case 'Star':
      return createStarGeometry()
    case 'Custom':
      return new THREE.IcosahedronGeometry(0.9, 1)
    case 'Cube':
    default:
      return new THREE.BoxGeometry(1.45, 1.45, 1.45, 2, 2, 2)
  }
}

function createMaterial(item, selected) {
  const settings = {
    color: item.color,
    wireframe: item.wireframe,
    emissive: selected ? item.color : '#000000',
    emissiveIntensity: selected ? 0.18 : 0,
  }

  if (item.material === 'Metallic') {
    return new THREE.MeshStandardMaterial({ ...settings, metalness: 0.9, roughness: 0.22 })
  }
  if (item.material === 'Matte') {
    return new THREE.MeshStandardMaterial({ ...settings, metalness: 0, roughness: 0.92 })
  }
  if (item.material === 'Glass') {
    return new THREE.MeshPhysicalMaterial({
      ...settings,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.45,
      transparent: true,
      opacity: 0.68,
      thickness: 0.8,
      depthWrite: false,
    })
  }
  return new THREE.MeshStandardMaterial({ ...settings, metalness: 0.28, roughness: 0.18 })
}

function normalizeScene(value) {
  if (!value || !Array.isArray(value.objects) || value.objects.length > 100) {
    throw new Error('This file does not contain a valid PixelAlchemy 3D scene.')
  }

  const objects = value.objects.map((item) => {
    const type = OBJECT_TYPES.find((option) => option.type === item.type)?.type
    if (
      !type ||
      typeof item.color !== 'string' ||
      !/^#[\da-f]{6}$/i.test(item.color) ||
      !Array.isArray(item.position) ||
      item.position.length !== 3 ||
      !item.position.every(Number.isFinite) ||
      !Array.isArray(item.rotation) ||
      item.rotation.length !== 3 ||
      !item.rotation.every(Number.isFinite)
    ) {
      throw new Error('The scene file contains an invalid 3D object.')
    }

    return {
      id: `object-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      color: item.color,
      material: MATERIALS.includes(item.material) ? item.material : 'Glossy',
      wireframe: Boolean(item.wireframe),
      position: item.position.map((coordinate) => THREE.MathUtils.clamp(coordinate, -4, 4)),
      rotation: item.rotation.map((angle) => THREE.MathUtils.clamp(angle, -Math.PI * 2, Math.PI * 2)),
      scale: THREE.MathUtils.clamp(Number.isFinite(item.scale) ? item.scale : 1, 0.35, 2.2),
    }
  })

  return {
    objects,
    background: BACKGROUNDS.some((option) => option.value === value.background)
      ? value.background
      : 'cosmic',
    rotationSpeed: Number.isFinite(value.rotationSpeed)
      ? THREE.MathUtils.clamp(value.rotationSpeed, 0, 2)
      : 0.35,
    showShadows: typeof value.showShadows === 'boolean' ? value.showShadows : true,
    zoom: Number.isFinite(value.zoom) ? THREE.MathUtils.clamp(value.zoom, 4.5, 14) : 8.5,
  }
}

function createSceneRenderer(container, canvasRef, sceneRef, cameraRef, rendererRef, meshMapRef) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(4.4, 3.5, 6.8)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.className = 'three-art-canvas'
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D art scene')
  container.appendChild(renderer.domElement)

  scene.add(new THREE.HemisphereLight(0xded7ff, 0x171326, 2.2))
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
  keyLight.position.set(4, 7, 5)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  scene.add(keyLight)
  const fillLight = new THREE.PointLight(0xa78bfa, 22, 18)
  fillLight.position.set(-4, 2, -3)
  scene.add(fillLight)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.22 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.6
  floor.receiveShadow = true
  scene.add(floor)

  sceneRef.current = scene
  cameraRef.current = camera
  rendererRef.current = renderer
  canvasRef.current = renderer.domElement

  function resize() {
    const width = container.clientWidth
    const height = container.clientHeight
    if (!width || !height) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  return () => {
    resizeObserver.disconnect()
    scene.traverse((node) => {
      if (node.isMesh) {
        node.geometry.dispose()
        if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose())
        else node.material.dispose()
      }
    })
    meshMapRef.current.clear()
    renderer.dispose()
    renderer.domElement.remove()
  }
}

function ThreeDArtStudio({ onSaveScene }) {
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const meshMapRef = useRef(new Map())
  const interactionRef = useRef(null)
  const sceneStateRef = useRef(DEFAULT_SCENE)
  const [sceneData, setSceneData] = useState(DEFAULT_SCENE)
  const [selectedId, setSelectedId] = useState(null)
  const [activeType, setActiveType] = useState('Cube')
  const [rotationSpeed, setRotationSpeed] = useState(0.35)
  const rotationSpeedRef = useRef(rotationSpeed)
  const [zoom, setZoom] = useState(8.5)
  const [showShadows, setShowShadows] = useState(true)
  const [sceneError, setSceneError] = useState('')
  const importRef = useRef(null)

  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed
  }, [rotationSpeed])

  const updateScene = useCallback((nextScene) => {
    sceneStateRef.current = nextScene
    setSceneData(nextScene)
  }, [])

  const updateZoom = useCallback((value) => {
    const nextZoom = Number(value)
    setZoom(nextZoom)
    if (!cameraRef.current) return
    cameraRef.current.position.setLength(nextZoom)
    cameraRef.current.updateProjectionMatrix()
  }, [])

  useEffect(() => {
    const container = stageRef.current
    if (!container) return undefined

    try {
      const cleanup = createSceneRenderer(
        container,
        canvasRef,
        sceneRef,
        cameraRef,
        rendererRef,
        meshMapRef
      )
      let frameId
      let previousTime = 0
      const render = (time) => {
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0
        previousTime = time
        meshMapRef.current.forEach((mesh) => {
          if (rotationSpeedRef.current > 0) {
            mesh.rotation.y += delta * rotationSpeedRef.current
            mesh.rotation.x += delta * rotationSpeedRef.current * 0.22
          }
        })
        rendererRef.current?.render(sceneRef.current, cameraRef.current)
        frameId = window.requestAnimationFrame(render)
      }
      frameId = window.requestAnimationFrame(render)

      return () => {
        window.cancelAnimationFrame(frameId)
        cleanup()
        canvasRef.current = null
        sceneRef.current = null
        cameraRef.current = null
        rendererRef.current = null
      }
    } catch (error) {
      console.error('Unable to initialize the 3D scene:', error)
      window.setTimeout(
        () => setSceneError('3D rendering could not start. Please use a browser with WebGL enabled.'),
        0
      )
      return undefined
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const currentIds = new Set(sceneData.objects.map((item) => item.id))
    meshMapRef.current.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        scene.remove(mesh)
        mesh.geometry.dispose()
        mesh.material.dispose()
        meshMapRef.current.delete(id)
      }
    })

    sceneData.objects.forEach((item) => {
      let mesh = meshMapRef.current.get(item.id)
      if (!mesh || mesh.userData.objectType !== item.type) {
        if (mesh) {
          scene.remove(mesh)
          mesh.geometry.dispose()
          mesh.material.dispose()
        }
        mesh = new THREE.Mesh(createGeometry(item.type), createMaterial(item, item.id === selectedId))
        mesh.userData.objectType = item.type
        mesh.castShadow = true
        mesh.receiveShadow = true
        meshMapRef.current.set(item.id, mesh)
        scene.add(mesh)
      } else {
        mesh.material.dispose()
        mesh.material = createMaterial(item, item.id === selectedId)
      }
      mesh.position.set(...item.position)
      mesh.rotation.set(...item.rotation)
      mesh.scale.setScalar(item.scale)
    })
  }, [sceneData, selectedId])

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.shadowMap.enabled = showShadows
  }, [showShadows])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined

    function zoomWithWheel(event) {
      event.preventDefault()
      updateZoom(THREE.MathUtils.clamp(zoom + Math.sign(event.deltaY) * 0.45, 4.5, 14))
    }

    stage.addEventListener('wheel', zoomWithWheel, { passive: false })
    return () => stage.removeEventListener('wheel', zoomWithWheel)
  }, [zoom, updateZoom])

  const selectedObject = sceneData.objects.find((item) => item.id === selectedId) || null

  function addObject() {
    const item = createObject(activeType, sceneData.objects.length)
    updateScene({ ...sceneData, objects: [...sceneData.objects, item] })
    setSelectedId(item.id)
  }

  function updateSelected(changes) {
    if (!selectedObject) return
    updateScene({
      ...sceneData,
      objects: sceneData.objects.map((item) =>
        item.id === selectedId ? { ...item, ...changes } : item
      ),
    })
  }

  function updatePosition(axis, value) {
    if (!selectedObject) return
    const index = { x: 0, y: 1, z: 2 }[axis]
    const position = [...selectedObject.position]
    position[index] = Number(value)
    updateSelected({ position })
  }

  function updateRotation(axis, degrees) {
    if (!selectedObject) return
    const index = { x: 0, y: 1, z: 2 }[axis]
    const rotation = [...selectedObject.rotation]
    rotation[index] = (Number(degrees) * Math.PI) / 180
    updateSelected({ rotation })
  }

  function deleteSelected() {
    if (!selectedId) return
    updateScene({ ...sceneData, objects: sceneData.objects.filter((item) => item.id !== selectedId) })
    setSelectedId(null)
  }

  function duplicateSelected() {
    if (!selectedObject) return
    const duplicate = createObject(selectedObject.type, sceneData.objects.length)
    const copy = {
      ...selectedObject,
      id: duplicate.id,
      position: [selectedObject.position[0] + 0.7, selectedObject.position[1], selectedObject.position[2] + 0.4],
    }
    updateScene({ ...sceneData, objects: [...sceneData.objects, copy] })
    setSelectedId(copy.id)
  }

  function resetScene() {
    updateScene({ ...DEFAULT_SCENE })
    setSelectedId(null)
    setZoom(8.5)
    setRotationSpeed(0.35)
    setShowShadows(true)
    if (cameraRef.current) {
      cameraRef.current.position.set(4.4, 3.5, 6.8)
      cameraRef.current.lookAt(0, 0, 0)
    }
  }

  function pointerToNdc(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )
  }

  function handlePointerDown(event) {
    if (event.button !== 0 || !canvasRef.current) return
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointerToNdc(event), cameraRef.current)
    const intersections = raycaster.intersectObjects([...meshMapRef.current.values()])

    if (intersections.length) {
      const mesh = intersections[0].object
      const id = [...meshMapRef.current.entries()].find(([, candidate]) => candidate === mesh)?.[0]
      if (!id) return
      setSelectedId(id)
      const normal = new THREE.Vector3()
      cameraRef.current.getWorldDirection(normal)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, mesh.position)
      interactionRef.current = {
        mode: 'move',
        id,
        plane,
      }
    } else {
      interactionRef.current = {
        mode: 'orbit',
        x: event.clientX,
        y: event.clientY,
        theta: Math.atan2(cameraRef.current.position.x, cameraRef.current.position.z),
        phi: Math.acos(THREE.MathUtils.clamp(cameraRef.current.position.y / cameraRef.current.position.length(), -1, 1)),
      }
      setSelectedId(null)
    }
    canvasRef.current.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    const interaction = interactionRef.current
    if (!interaction || !cameraRef.current) return
    if (interaction.mode === 'orbit') {
      const deltaX = event.clientX - interaction.x
      const deltaY = event.clientY - interaction.y
      const radius = cameraRef.current.position.length()
      const theta = interaction.theta - deltaX * 0.008
      const phi = THREE.MathUtils.clamp(interaction.phi + deltaY * 0.008, 0.2, Math.PI - 0.2)
      cameraRef.current.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      )
      cameraRef.current.lookAt(0, 0, 0)
      return
    }

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointerToNdc(event), cameraRef.current)
    const point = new THREE.Vector3()
    if (!raycaster.ray.intersectPlane(interaction.plane, point)) return

    const item = sceneStateRef.current.objects.find((object) => object.id === interaction.id)
    if (!item) return
    const nextPosition = [
      THREE.MathUtils.clamp(point.x, -4, 4),
      THREE.MathUtils.clamp(point.y, -0.8, 3.5),
      THREE.MathUtils.clamp(point.z, -4, 4),
    ]
    const nextScene = {
      ...sceneStateRef.current,
      objects: sceneStateRef.current.objects.map((object) =>
        object.id === interaction.id ? { ...object, position: nextPosition } : object
      ),
    }
    updateScene(nextScene)
  }

  function finishPointerAction() {
    interactionRef.current = null
  }

  function sceneImage() {
    if (!canvasRef.current) return null
    rendererRef.current?.render(sceneRef.current, cameraRef.current)
    const source = canvasRef.current
    const output = document.createElement('canvas')
    output.width = source.width
    output.height = source.height
    const context = output.getContext('2d')
    if (!context) return null
    const gradient = context.createLinearGradient(0, 0, output.width, output.height)
    if (sceneData.background === 'sunset') {
      gradient.addColorStop(0, '#30153f')
      gradient.addColorStop(1, '#e96387')
    } else if (sceneData.background === 'ocean') {
      gradient.addColorStop(0, '#0b2447')
      gradient.addColorStop(1, '#146b83')
    } else if (sceneData.background === 'midnight') {
      gradient.addColorStop(0, '#080913')
      gradient.addColorStop(1, '#17142d')
    } else {
      gradient.addColorStop(0, '#17132c')
      gradient.addColorStop(1, '#30204f')
    }
    context.fillStyle = gradient
    context.fillRect(0, 0, output.width, output.height)
    context.drawImage(source, 0, 0)
    return output.toDataURL('image/png')
  }

  function downloadImage() {
    try {
      const image = sceneImage()
      if (!image) throw new Error('The 3D scene is not ready yet.')
      const link = document.createElement('a')
      link.download = 'pixelalchemy-3d-art.png'
      link.href = image
      link.click()
    } catch (error) {
      console.error('Unable to export the 3D scene as a PNG:', error)
      alert('Unable to download the 3D artwork. Please check the browser console.')
    }
  }

  function saveScene() {
    try {
      const image = sceneImage()
      if (!image) throw new Error('The 3D scene is not ready yet.')
      onSaveScene(image, { ...sceneData, rotationSpeed, showShadows, zoom })
    } catch (error) {
      console.error('Unable to save the 3D scene:', error)
      alert('Unable to save the 3D artwork. Please check the browser console.')
    }
  }

  function downloadSceneJson() {
    const file = new Blob([JSON.stringify({ version: 1, ...sceneData, rotationSpeed, showShadows, zoom }, null, 2)], {
      type: 'application/json',
    })
    const link = document.createElement('a')
    link.download = 'pixelalchemy-3d-scene.json'
    link.href = URL.createObjectURL(file)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  async function importScene(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const importedScene = normalizeScene(parsed)
      updateScene(importedScene)
      setRotationSpeed(importedScene.rotationSpeed)
      setShowShadows(importedScene.showShadows)
      updateZoom(importedScene.zoom)
      setSelectedId(null)
      setSceneError('')
    } catch (error) {
      console.error('Unable to import the 3D scene:', error)
      alert(error instanceof SyntaxError ? 'That file is not valid JSON.' : error.message)
    } finally {
      event.target.value = ''
    }
  }

  const backgroundClass = `three-art-stage background-${sceneData.background}`

  return (
    <section className="three-art-studio">
      <header className="three-art-welcome">
        <div>
          <p className="eyebrow">SHAPE YOUR IMAGINATION</p>
          <h1>Step into <span>another dimension.</span></h1>
          <p className="welcome-description">
            Build a colorful 3D scene, orbit around your creation, and make it your own.
          </p>
        </div>
        <div className="three-art-live"><span /> REAL-TIME 3D</div>
      </header>

      <div className="three-art-workspace">
        <aside className="three-art-sidebar three-art-library">
          <div className="three-art-heading">
            <p className="eyebrow">START WITH A SHAPE</p>
            <h2>Object library</h2>
          </div>
          <div className="three-art-object-grid">
            {OBJECT_TYPES.map((item) => (
              <button
                type="button"
                key={item.type}
                className={`three-art-object-choice ${activeType === item.type ? 'selected' : ''}`}
                onClick={() => setActiveType(item.type)}
                aria-pressed={activeType === item.type}
              >
                <span>{item.icon}</span>
                <small>{item.type}</small>
              </button>
            ))}
          </div>
          <button type="button" className="three-art-add-button" onClick={addObject}>
            <Plus size={16} /> Add {activeType}
          </button>
          <div className="three-art-scene-list">
            <div className="three-art-scene-list-title">IN THIS SCENE <span>{sceneData.objects.length}</span></div>
            {sceneData.objects.length ? sceneData.objects.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`three-art-scene-item ${selectedId === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <span>{OBJECT_TYPES.find((shape) => shape.type === item.type)?.icon}</span>
                {item.type}
                <i style={{ backgroundColor: item.color }} />
              </button>
            )) : <p className="three-art-empty-list">Add a shape to begin your scene.</p>}
          </div>
        </aside>

        <section className="three-art-canvas-panel">
          <div className="three-art-toolbar">
            <div className="three-art-canvas-title"><span className="status-dot" /> 3D VIEWPORT</div>
            <div className="three-art-toolbar-actions">
              <button type="button" onClick={duplicateSelected} disabled={!selectedObject} title="Duplicate selected object"><Copy size={15} /><span>Duplicate</span></button>
              <button type="button" onClick={deleteSelected} disabled={!selectedObject} title="Delete selected object"><Trash2 size={15} /><span>Delete</span></button>
              <button type="button" onClick={resetScene} title="Reset scene"><RotateCcw size={15} /><span>Reset</span></button>
            </div>
          </div>

          <div
            ref={stageRef}
            className={backgroundClass}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerAction}
            onPointerCancel={finishPointerAction}
          >
            {sceneError && <div className="three-art-error">{sceneError}</div>}
            {!sceneError && sceneData.objects.length === 0 && (
              <div className="three-art-empty-prompt">
                <span>✦</span>
                <strong>Your 3D canvas is ready</strong>
                <small>Choose a shape on the left to get started</small>
              </div>
            )}
            <div className="three-art-canvas-hint">DRAG TO ORBIT <span>·</span> SCROLL TO ZOOM</div>
          </div>

          <div className="three-art-export-bar">
            <span>{selectedObject ? `${selectedObject.type} selected` : `${sceneData.objects.length} objects in scene`}</span>
            <div>
              <button type="button" onClick={downloadSceneJson}><ArrowDownToLine size={15} /> Export JSON</button>
              <button type="button" onClick={() => importRef.current?.click()}><Upload size={15} /> Import</button>
              <input ref={importRef} className="three-art-file-input" type="file" accept="application/json,.json" onChange={importScene} />
              <button type="button" onClick={downloadImage}><Download size={15} /> PNG</button>
              <button type="button" className="three-art-save-button" onClick={saveScene}><Save size={15} /> Save</button>
            </div>
          </div>
        </section>

        <aside className="three-art-sidebar three-art-inspector">
          <div className="three-art-heading">
            <p className="eyebrow">FINE-TUNE YOUR SCENE</p>
            <h2>Scene settings</h2>
          </div>

          <div className="three-art-setting">
            <label htmlFor="three-art-background">Background</label>
            <select id="three-art-background" value={sceneData.background} onChange={(event) => updateScene({ ...sceneData, background: event.target.value })}>
              {BACKGROUNDS.map((item) => <option key={item.value} value={item.value}>{item.name}</option>)}
            </select>
          </div>
          <div className="three-art-setting">
            <div className="three-art-slider-label"><label htmlFor="three-art-zoom">Camera zoom</label><span>{zoom.toFixed(1)}×</span></div>
            <input id="three-art-zoom" type="range" min="4.5" max="14" step="0.1" value={zoom} onChange={(event) => updateZoom(event.target.value)} />
          </div>
          <div className="three-art-setting">
            <div className="three-art-slider-label"><label htmlFor="three-art-speed">Rotation speed</label><span>{rotationSpeed.toFixed(1)}×</span></div>
            <input id="three-art-speed" type="range" min="0" max="2" step="0.1" value={rotationSpeed} onChange={(event) => setRotationSpeed(Number(event.target.value))} />
          </div>
          <label className="three-art-toggle"><input type="checkbox" checked={showShadows} onChange={(event) => setShowShadows(event.target.checked)} /> Scene shadows</label>

          <div className="three-art-inspector-divider" />
          <div className="three-art-heading three-art-properties-heading">
            <p className="eyebrow">SELECT AN OBJECT</p>
            <h2>{selectedObject ? selectedObject.type : 'Object properties'}</h2>
          </div>
          {selectedObject ? (
            <>
              <div className="three-art-setting">
                <label htmlFor="three-art-color">Object color</label>
                <div className="three-art-color-field">
                  <input id="three-art-color" type="color" value={selectedObject.color} onChange={(event) => updateSelected({ color: event.target.value })} />
                  <span>{selectedObject.color.toUpperCase()}</span>
                </div>
              </div>
              <div className="three-art-setting">
                <label htmlFor="three-art-material">Material</label>
                <select id="three-art-material" value={selectedObject.material} onChange={(event) => updateSelected({ material: event.target.value })}>
                  {MATERIALS.map((material) => <option key={material} value={material}>{material}</option>)}
                </select>
              </div>
              <label className="three-art-toggle"><input type="checkbox" checked={selectedObject.wireframe} onChange={(event) => updateSelected({ wireframe: event.target.checked })} /> Wireframe mode</label>
              <div className="three-art-setting">
                <div className="three-art-slider-label"><label htmlFor="three-art-scale">Object size</label><span>{selectedObject.scale.toFixed(1)}×</span></div>
                <input id="three-art-scale" type="range" min="0.35" max="2.2" step="0.05" value={selectedObject.scale} onChange={(event) => updateSelected({ scale: Number(event.target.value) })} />
              </div>
              <div className="three-art-axis-list">
                {['x', 'y', 'z'].map((axis) => (
                  <div className="three-art-setting" key={`position-${axis}`}>
                    <div className="three-art-slider-label"><label htmlFor={`position-${axis}`}>Position {axis.toUpperCase()}</label><span>{selectedObject.position['xyz'.indexOf(axis)].toFixed(1)}</span></div>
                    <input id={`position-${axis}`} type="range" min={axis === 'y' ? -0.8 : -4} max={axis === 'y' ? 3.5 : 4} step="0.1" value={selectedObject.position['xyz'.indexOf(axis)]} onChange={(event) => updatePosition(axis, event.target.value)} />
                  </div>
                ))}
              </div>
              <div className="three-art-axis-list three-art-rotation-list">
                {['x', 'y', 'z'].map((axis) => (
                  <div className="three-art-setting" key={`rotation-${axis}`}>
                    <div className="three-art-slider-label"><label htmlFor={`rotation-${axis}`}>Rotate {axis.toUpperCase()}</label><span>{Math.round((selectedObject.rotation['xyz'.indexOf(axis)] * 180) / Math.PI)}°</span></div>
                    <input id={`rotation-${axis}`} type="range" min="-180" max="180" value={Math.round((selectedObject.rotation['xyz'.indexOf(axis)] * 180) / Math.PI)} onChange={(event) => updateRotation(axis, event.target.value)} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="three-art-empty-properties"><span>◇</span><p>Choose an object in your scene to edit its color, material, position, and rotation.</p></div>
          )}
        </aside>
      </div>
    </section>
  )
}

export default ThreeDArtStudio
