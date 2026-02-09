import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const KEYWORDS = [
  'JAX',
  'CUDA',
  'Distributed Systems',
  'Mixture of Experts',
  'Tensor Parallelism',
  'Data Parallelism',
  'RLHF / GRPO',
  'Graph Neural Networks',
  'Transformer',
  'Attention',
  'Triton',
  'TPU / GPU',
  'Reinforcement Learning',
  'Causal Inference',
  'Deep Learning',
  'Embeddings',
  'Scaling Laws',
  'AutoML',
  'PyTorch',
  'TensorFlow',
  'Knowledge Graph',
  'Feature Store',
]

interface Point3D {
  x: number
  y: number
  z: number
  text: string
}

interface ProjectedPoint {
  x: number
  y: number
  z: number
  text: string
  scale: number
}

export default function TechGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const rotRef = useRef({ rx: 0, ry: 0, autoRx: 0.0006, autoRy: 0.0012 })
  const dragRef = useRef({ lastX: 0, lastY: 0, dragging: false })
  const clickRef = useRef({ startX: 0, startY: 0 })
  const navigate = useNavigate()

  const initPoints = useCallback((): Point3D[] => {
    const pts: Point3D[] = []
    const n = KEYWORDS.length
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = goldenAngle * i
      pts.push({
        x: Math.cos(theta) * radiusAtY,
        y,
        z: Math.sin(theta) * radiusAtY,
        text: KEYWORDS[i],
      })
    }
    return pts
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const points = initPoints()
    let dpr = window.devicePixelRatio || 1
    let projectedPoints: ProjectedPoint[] = []

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      dpr = window.devicePixelRatio || 1
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function rotateY(p: Point3D, angle: number): Point3D {
      const cos = Math.cos(angle), sin = Math.sin(angle)
      return { ...p, x: p.x * cos - p.z * sin, z: p.x * sin + p.z * cos }
    }

    function rotateX(p: Point3D, angle: number): Point3D {
      const cos = Math.cos(angle), sin = Math.sin(angle)
      return { ...p, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos }
    }

    function draw() {
      const rect = canvas!.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const cx = w / 2
      const cy = h / 2
      const radius = Math.min(w, h) * 0.38

      ctx!.clearRect(0, 0, w, h)

      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.2)
      grad.addColorStop(0, 'rgba(233, 30, 99, 0.04)')
      grad.addColorStop(0.5, 'rgba(21, 101, 192, 0.02)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, 0, w, h)

      ctx!.lineWidth = 0.5

      ctx!.strokeStyle = 'rgba(21, 101, 192, 0.1)'
      ctx!.beginPath()
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx!.stroke()

      ctx!.strokeStyle = 'rgba(233, 30, 99, 0.06)'
      ctx!.beginPath()
      ctx!.ellipse(cx, cy, radius, radius * 0.3, 0, 0, Math.PI * 2)
      ctx!.stroke()

      ctx!.beginPath()
      ctx!.ellipse(cx, cy, radius * 0.3, radius, 0, 0, Math.PI * 2)
      ctx!.stroke()

      ctx!.strokeStyle = 'rgba(21, 101, 192, 0.04)'
      ctx!.beginPath()
      ctx!.ellipse(cx, cy, radius * 0.85, radius * 0.35, Math.PI / 4, 0, Math.PI * 2)
      ctx!.stroke()

      const rot = rotRef.current
      if (!dragRef.current.dragging) {
        let speedMul = 1
        if (mouseRef.current.active) {
          const mdx = mouseRef.current.x - cx
          const mdy = mouseRef.current.y - cy
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy)
          if (mDist < radius * 1.5) {
            speedMul = 1 + 3 * (1 - mDist / (radius * 1.5))
            rot.ry += (mdx / w) * 0.002 * speedMul
            rot.rx += (mdy / h) * 0.002 * speedMul
          }
        }
        rot.rx += rot.autoRx * speedMul
        rot.ry += rot.autoRy * speedMul
      }

      projectedPoints = points.map((p) => {
        let rp = rotateY(p, rot.ry)
        rp = rotateX(rp, rot.rx)
        const scale = 1 / (1 - rp.z * 0.3)
        return {
          x: cx + rp.x * radius * scale,
          y: cy + rp.y * radius * scale,
          z: rp.z,
          text: rp.text || p.text,
          scale,
        }
      })

      projectedPoints.sort((a, b) => a.z - b.z)

      ctx!.shadowBlur = 0
      ctx!.shadowColor = 'transparent'

      for (const p of projectedPoints) {
        const depth = (p.z + 1) / 2
        const isFront = depth > 0.82
        const isVeryFront = depth > 0.92

        const size = isVeryFront
          ? 13
          : isFront
            ? 10.5 + (depth - 0.82) * 25
            : 7 + depth * 4

        const alpha = isVeryFront
          ? 1
          : isFront
            ? 0.7 + (depth - 0.82) * 1.5
            : 0.05 + depth * 0.65

        const r = Math.floor(233 * depth + 21 * (1 - depth))
        const g = Math.floor(30 * depth + 101 * (1 - depth))
        const b2 = Math.floor(99 * depth + 192 * (1 - depth))

        const weight = isVeryFront ? '700' : isFront ? '600' : '400'
        ctx!.font = `${weight} ${size}px "Inter", system-ui, sans-serif`
        ctx!.textAlign = 'center'
        ctx!.textBaseline = 'middle'

        if (isVeryFront) {
          ctx!.shadowColor = `rgba(233, 30, 99, 0.6)`
          ctx!.shadowBlur = 12
        } else if (isFront) {
          ctx!.shadowColor = `rgba(233, 30, 99, 0.25)`
          ctx!.shadowBlur = 6
        } else {
          ctx!.shadowBlur = 0
          ctx!.shadowColor = 'transparent'
        }

        ctx!.fillStyle = `rgba(${r}, ${g}, ${b2}, ${alpha})`
        ctx!.fillText(p.text, p.x, p.y)

        if (!isFront) {
          ctx!.shadowBlur = 0
          ctx!.shadowColor = 'transparent'
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, 1.2 * depth, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${r}, ${g}, ${b2}, ${alpha * 0.4})`
          ctx!.fill()
        }
      }

      ctx!.shadowBlur = 0
      ctx!.shadowColor = 'transparent'

      animId = requestAnimationFrame(draw)
    }

    function onMouseDown(e: MouseEvent) {
      dragRef.current = { lastX: e.clientX, lastY: e.clientY, dragging: true }
      clickRef.current = { startX: e.clientX, startY: e.clientY }
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true }
      if (dragRef.current.dragging) {
        const dx = e.clientX - dragRef.current.lastX
        const dy = e.clientY - dragRef.current.lastY
        rotRef.current.ry += dx * 0.005
        rotRef.current.rx += dy * 0.005
        dragRef.current.lastX = e.clientX
        dragRef.current.lastY = e.clientY
      }
    }

    function onMouseUp(e: MouseEvent) {
      const dx = e.clientX - clickRef.current.startX
      const dy = e.clientY - clickRef.current.startY
      const wasDrag = Math.sqrt(dx * dx + dy * dy) > 5

      if (!wasDrag) {
        const rect = canvas!.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top

        for (let i = projectedPoints.length - 1; i >= 0; i--) {
          const p = projectedPoints[i]
          const depth = (p.z + 1) / 2
          if (depth < 0.5) continue
          const hitDist = Math.sqrt((clickX - p.x) ** 2 + (clickY - p.y) ** 2)
          if (hitDist < 40) {
            navigate(`/search?q=${encodeURIComponent(p.text)}`)
            break
          }
        }
      }

      dragRef.current.dragging = false
    }

    function onMouseLeave() {
      dragRef.current.dragging = false
      mouseRef.current.active = false
    }

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0]
      dragRef.current = { lastX: t.clientX, lastY: t.clientY, dragging: true }
      clickRef.current = { startX: t.clientX, startY: t.clientY }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      const t = e.touches[0]
      const dx = t.clientX - dragRef.current.lastX
      const dy = t.clientY - dragRef.current.lastY
      rotRef.current.ry += dx * 0.005
      rotRef.current.rx += dy * 0.005
      dragRef.current.lastX = t.clientX
      dragRef.current.lastY = t.clientY
    }

    function onTouchEnd(e: TouchEvent) {
      const t = e.changedTouches[0]
      const dx = t.clientX - clickRef.current.startX
      const dy = t.clientY - clickRef.current.startY
      const wasDrag = Math.sqrt(dx * dx + dy * dy) > 5

      if (!wasDrag) {
        const rect = canvas!.getBoundingClientRect()
        const tapX = t.clientX - rect.left
        const tapY = t.clientY - rect.top

        for (let i = projectedPoints.length - 1; i >= 0; i--) {
          const p = projectedPoints[i]
          const depth = (p.z + 1) / 2
          if (depth < 0.5) continue
          const hitDist = Math.sqrt((tapX - p.x) ** 2 + (tapY - p.y) ** 2)
          if (hitDist < 40) {
            navigate(`/search?q=${encodeURIComponent(p.text)}`)
            break
          }
        }
      }

      dragRef.current.dragging = false
    }

    resize()
    draw()

    window.addEventListener('resize', resize)
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [initPoints, navigate])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    />
  )
}
