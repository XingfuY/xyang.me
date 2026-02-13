import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Calendar, FileText, FolderGit2 } from 'lucide-react'
import manifest from '../generated/content-manifest.json'

interface Post {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
}

interface Project {
  slug: string
  title: string
  description: string
  tags: string[]
  repo?: string
}

const posts: Post[] = manifest.posts as Post[]
const projects: Project[] = manifest.projects as Project[]

function matchesQuery(query: string, ...fields: string[]): boolean {
  const q = query.toLowerCase()
  return fields.some((f) => f.toLowerCase().includes(q))
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeQuery = searchParams.get('q') || ''
  const [inputValue, setInputValue] = useState(activeQuery)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = inputValue.trim()
    if (q) {
      setSearchParams({ q })
    } else {
      setSearchParams({})
    }
  }

  const results = useMemo(() => {
    if (!activeQuery) return { posts: [] as Post[], projects: [] as Project[] }
    return {
      posts: posts.filter((p) =>
        matchesQuery(activeQuery, p.title, p.description, ...(p.tags ?? []))
      ),
      projects: projects.filter((p) =>
        matchesQuery(activeQuery, p.title, p.description, ...(p.tags ?? []), p.repo ?? '')
      ),
    }
  }, [activeQuery])

  const totalResults = results.posts.length + results.projects.length

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
        <>
          <p className="text-sm text-slate-500 mb-6">
            {totalResults} result{totalResults !== 1 ? 's' : ''} for "<span className="text-crimson">{activeQuery}</span>"
          </p>

          {results.posts.length > 0 && (
            <div className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-slate-300">
                <FileText size={18} />
                Posts
              </h2>
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/posts/${post.slug}`}
                    className="block p-5 rounded-xl border border-navy-lighter bg-navy-light/50 hover:border-crimson/20 transition-all group"
                  >
                    <h3 className="font-semibold group-hover:text-crimson transition-colors">{post.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <Calendar size={12} />
                      {post.date}
                    </div>
                    <p className="text-slate-400 mt-2 text-sm">{post.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.projects.length > 0 && (
            <div className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-slate-300">
                <FolderGit2 size={18} />
                Projects
              </h2>
              <div className="space-y-4">
                {results.projects.map((project) => (
                  <Link
                    key={project.slug}
                    to={`/projects/${project.slug}`}
                    className="block p-5 rounded-xl border border-navy-lighter bg-navy-light/50 hover:border-crimson/20 transition-all group"
                  >
                    <h3 className="font-semibold group-hover:text-crimson transition-colors">{project.title}</h3>
                    <p className="text-slate-400 mt-2 text-sm">{project.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
              <p className="text-slate-400">No results found. Try a different search term.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
