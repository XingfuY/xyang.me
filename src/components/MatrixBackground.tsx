import { useEffect, useRef } from 'react'

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1, y: -1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
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
      ctx!.fillStyle = 'rgba(10, 22, 40, 0.05)'
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
        let alpha = 0.15 + Math.random() * 0.15

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

      animationId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
