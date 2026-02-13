import { useParams, Link } from 'react-router-dom'
import { Tag, Calendar, ArrowLeft } from 'lucide-react'
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

function collectTags(): { name: string; count: number }[] {
  const tagCounts = new Map<string, number>()
  for (const post of posts) {
    for (const t of post.tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
    }
  }
  for (const project of projects) {
    for (const t of project.tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
    }
  }
  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

const allTags = collectTags()

export default function TagsPage() {
  const { tag } = useParams<{ tag: string }>()

  if (tag) {
    const matchingPosts = posts.filter((p) => p.tags?.includes(tag))
    const matchingProjects = projects.filter((p) => p.tags?.includes(tag))
    const total = matchingPosts.length + matchingProjects.length

    return (
      <div className="animate-fade-in">
        <Link to="/tags" className="inline-flex items-center gap-2 text-slate-400 hover:text-crimson transition-colors text-sm mb-6">
          <ArrowLeft size={14} />
          All Tags
        </Link>
        <h1 className="text-4xl font-bold mb-2">
          <span className="gradient-brand-text">#{tag}</span>
        </h1>
        <p className="text-slate-400 mb-8">{total} item{total !== 1 ? 's' : ''} tagged with "{tag}"</p>

        {matchingPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-slate-300">Posts</h2>
            <div className="space-y-4">
              {matchingPosts.map((post) => (
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

        {matchingProjects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-slate-300">Projects</h2>
            <div className="space-y-4">
              {matchingProjects.map((project) => (
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

        {total === 0 && (
          <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
            <p className="text-slate-400">No content found with tag "{tag}".</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-bold mb-2">
        <span className="gradient-brand-text">Tags</span>
      </h1>
      <p className="text-slate-400 mb-8">Browse content by topic.</p>

      {allTags.length === 0 ? (
        <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
          <p className="text-slate-400">No tags yet. Add posts or projects with tags to populate this page.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {allTags.map(({ name, count }) => (
            <Link
              key={name}
              to={`/tags/${encodeURIComponent(name)}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-navy-lighter bg-navy-light/50 hover:border-crimson/30 transition-colors group"
            >
              <Tag size={14} className="text-slate-500 group-hover:text-crimson transition-colors" />
              <span className="text-sm font-medium">{name}</span>
              <span className="text-xs text-slate-500 bg-navy-lighter px-1.5 py-0.5 rounded">
                {count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
