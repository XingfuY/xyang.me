import { Moon, Sun, Monitor, Pause, Play } from 'lucide-react'

type ThemeMode = 'dark' | 'light' | 'auto'

interface Props {
  themeMode: ThemeMode
  rainPaused: boolean
  onCycleTheme: () => void
  onToggleRain: () => void
}

const themeIcon: Record<ThemeMode, typeof Moon> = {
  dark: Moon,
  light: Sun,
  auto: Monitor,
}

const themeLabel: Record<ThemeMode, string> = {
  dark: 'Dark',
  light: 'Light',
  auto: 'Auto',
}

export default function ControlPanel({ themeMode, rainPaused, onCycleTheme, onToggleRain }: Props) {
  const ThemeIcon = themeIcon[themeMode]

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={onCycleTheme}
        className="group relative p-2 rounded-lg bg-navy-light/80 backdrop-blur-sm border border-navy-lighter hover:border-crimson/30 transition-colors"
        aria-label={`Theme: ${themeLabel[themeMode]}`}
      >
        <ThemeIcon size={18} className="text-slate-300" />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs rounded bg-navy-light border border-navy-lighter text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {themeLabel[themeMode]}
        </span>
      </button>

      <button
        onClick={onToggleRain}
        className="group relative p-2 rounded-lg bg-navy-light/80 backdrop-blur-sm border border-navy-lighter hover:border-crimson/30 transition-colors"
        aria-label={rainPaused ? 'Resume rain' : 'Pause rain'}
      >
        {rainPaused
          ? <Play size={18} className="text-slate-300" />
          : <Pause size={18} className="text-slate-300" />
        }
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs rounded bg-navy-light border border-navy-lighter text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {rainPaused ? 'Play' : 'Pause'}
        </span>
      </button>
    </div>
  )
}
