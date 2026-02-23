import { useEffect, useRef } from 'react'

interface Props {
  paused?: boolean
  lightMode?: boolean
}

export default function MatrixBackground({ paused = false, lightMode = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1, y: -1 })
  const pausedRef = useRef(paused)
  const lightRef = useRef(lightMode)
  const animIdRef = useRef<number>(0)
  const drawRef = useRef<(() => void) | null>(null)

  // Keep refs in sync without re-running the main effect
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => {
    lightRef.current = lightMode
    // Clear canvas on theme change to prevent residual overlay from previous mode
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = lightMode ? 'rgba(248, 250, 252, 1)' : 'rgba(10, 22, 40, 1)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [lightMode])

  // Main animation effect — runs once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let columns: number[] = []

    const chars = '01アイウエオカキクケコ∑∏∫∂√∞≈≠±∈∉⊂⊃∪∩'
    const fontSize = 14
    const mouseRadius = 150

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      const colCount = Math.floor(canvas!.width / fontSize)
      columns = Array(colCount).fill(0).map(() => Math.random() * canvas!.height / fontSize)
    }

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -1, y: -1 }
    }

    function draw() {
      if (pausedRef.current) {
        animIdRef.current = 0
        return
      }

      const isLight = lightRef.current
      const fadeColor = isLight ? 'rgba(248, 250, 252, 0.05)' : 'rgba(10, 22, 40, 0.05)'
      ctx!.fillStyle = fadeColor
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (let i = 0; i < columns.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        const y = columns[i] * fontSize

        const dx = x - mx
        const dy = y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        const nearMouse = mx >= 0 && dist < mouseRadius

        const progress = y / canvas!.height
        let r = Math.floor(233 * (1 - progress) + 21 * progress)
        let g = Math.floor(30 * (1 - progress) + 101 * progress)
        let b = Math.floor(99 * (1 - progress) + 192 * progress)
        let alpha = isLight
          ? 0.20 + Math.random() * 0.20
          : 0.15 + Math.random() * 0.15

        if (nearMouse) {
          const intensity = 1 - dist / mouseRadius
          r = Math.min(255, r + Math.floor(100 * intensity))
          g = Math.min(255, g + Math.floor(60 * intensity))
          b = Math.min(255, b + Math.floor(80 * intensity))
          alpha = 0.4 + 0.6 * intensity

          const pushStrength = intensity * 3
          const angle = Math.atan2(dy, dx)
          const offsetX = Math.cos(angle) * pushStrength * fontSize
          const offsetY = Math.sin(angle) * pushStrength * fontSize

          ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
          ctx!.font = `${fontSize}px "JetBrains Mono", monospace`
          ctx!.fillText(char, x + offsetX, y + offsetY)
        } else {
          ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
          ctx!.font = `${fontSize}px "JetBrains Mono", monospace`
          ctx!.fillText(char, x, y)
        }

        if (y > canvas!.height && Math.random() > 0.975) {
          columns[i] = 0
        }

        const speedBoost = nearMouse ? 1.5 * (1 - dist / mouseRadius) : 0
        columns[i] += 0.5 + Math.random() * 0.5 + speedBoost
      }

      animIdRef.current = requestAnimationFrame(draw)
    }

    drawRef.current = draw

    resize()
    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animIdRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Resume animation when unpaused
  useEffect(() => {
    if (!paused && animIdRef.current === 0 && drawRef.current) {
      animIdRef.current = requestAnimationFrame(drawRef.current)
    }
  }, [paused])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
