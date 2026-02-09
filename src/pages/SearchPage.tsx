import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeQuery = searchParams.get('q') || ''
  const [inputValue, setInputValue] = useState(activeQuery)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() })
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">
        <span className="gradient-brand-text">Search</span>
      </h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search posts, projects, keywords..."
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-navy-light border border-navy-lighter text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-crimson/50 transition-colors"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="gradient-brand px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      {activeQuery && (
        <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
          <p className="text-slate-400">
            Full-text search will be powered by FlexSearch once content is added.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Searching for: <code className="text-crimson">{activeQuery}</code>
          </p>
        </div>
      )}
    </div>
  )
}
