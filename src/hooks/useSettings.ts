import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

type ThemeMode = 'dark' | 'light' | 'auto'

interface Settings {
  themeMode: ThemeMode
  resolvedTheme: 'dark' | 'light'
  rainPaused: boolean
  cycleTheme: () => void
  toggleRain: () => void
}

const THEME_KEY = 'xyang-theme'
const RAIN_KEY = 'xyang-rain-paused'
const GEO_KEY = 'xyang-geo-cache'
const GEO_TTL = 6 * 60 * 60 * 1000 // 6 hours

// Simplified NOAA sunrise/sunset algorithm
function getSunTimes(lat: number, lng: number, date: Date): { sunrise: Date; sunset: Date } {
  const rad = Math.PI / 180
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  )

  const declination = -23.45 * Math.cos(rad * (360 / 365) * (dayOfYear + 10))

  const latRad = lat * rad
  const declRad = declination * rad
  const cosH = -Math.tan(latRad) * Math.tan(declRad)

  // Clamp for polar regions
  if (cosH < -1) return { sunrise: new Date(date.setHours(0)), sunset: new Date(date.setHours(23, 59)) }
  if (cosH > 1) return { sunrise: new Date(date.setHours(12)), sunset: new Date(date.setHours(12)) }

  const hourAngle = Math.acos(cosH) / rad
  const solarNoonLST = 12 - lng / 15
  const tzOffset = date.getTimezoneOffset() / 60
  const solarNoon = solarNoonLST + tzOffset

  const riseHour = solarNoon - hourAngle / 15
  const setHour = solarNoon + hourAngle / 15

  const sunrise = new Date(date)
  sunrise.setHours(Math.floor(riseHour), Math.round((riseHour % 1) * 60), 0, 0)

  const sunset = new Date(date)
  sunset.setHours(Math.floor(setHour), Math.round((setHour % 1) * 60), 0, 0)

  return { sunrise, sunset }
}

function isDaytime(lat: number, lng: number): boolean {
  const now = new Date()
  const { sunrise, sunset } = getSunTimes(lat, lng, now)
  return now >= sunrise && now <= sunset
}

function getCachedGeo(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(GEO_KEY)
    if (!raw) return null
    const { lat, lng, ts } = JSON.parse(raw)
    if (Date.now() - ts > GEO_TTL) return null
    return { lat, lng }
  } catch {
    return null
  }
}

export function useSettings(): Settings {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_KEY)
    return (stored === 'dark' || stored === 'light' || stored === 'auto') ? stored : 'auto'
  })

  const [rainPaused, setRainPaused] = useState(() => {
    return localStorage.getItem(RAIN_KEY) === 'true'
  })

  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(getCachedGeo)

  // Track OS preference as reactive state
  const [prefersDark, setPrefersDark] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  )

  // Tick counter to re-evaluate sunrise/sunset periodically
  const [tick, setTick] = useState(0)

  // Request geolocation once
  const geoRequested = useRef(false)
  useEffect(() => {
    if (geoRequested.current) return
    geoRequested.current = true

    if (getCachedGeo()) return

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        localStorage.setItem(GEO_KEY, JSON.stringify({ ...coords, ts: Date.now() }))
        setGeo(coords)
      },
      () => { /* denied or unavailable — rely on matchMedia */ },
      { timeout: 5000, maximumAge: GEO_TTL }
    )
  }, [])

  // Listen for OS preference changes
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Re-evaluate every 60s in case sun sets/rises during session
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Derive resolved theme from state — no setState in effects
  const resolvedTheme = useMemo((): 'dark' | 'light' => {
    // tick forces periodic re-evaluation for sunrise/sunset
    void tick
    if (themeMode !== 'auto') return themeMode
    if (geo) return isDaytime(geo.lat, geo.lng) ? 'light' : 'dark'
    return prefersDark ? 'dark' : 'light'
  }, [themeMode, geo, prefersDark, tick])

  // Apply class + meta theme-color (side-effect on DOM, not state)
  useEffect(() => {
    const html = document.documentElement
    if (resolvedTheme === 'light') {
      html.classList.add('light')
    } else {
      html.classList.remove('light')
    }

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', resolvedTheme === 'light' ? '#F8FAFC' : '#0A1628')
    }
  }, [resolvedTheme])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    localStorage.setItem(RAIN_KEY, String(rainPaused))
  }, [rainPaused])

  const cycleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const order: ThemeMode[] = ['dark', 'light', 'auto']
      return order[(order.indexOf(prev) + 1) % 3]
    })
  }, [])

  const toggleRain = useCallback(() => {
    setRainPaused((prev) => !prev)
  }, [])

  return { themeMode, resolvedTheme, rainPaused, cycleTheme, toggleRain }
}
