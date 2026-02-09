import { Link } from 'react-router-dom'
import { Calendar, Tag } from 'lucide-react'

interface Post {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
}

// Will be replaced by content manifest
const posts: Post[] = [
  {
    slug: 'hello-world',
    title: 'Hello World — Launching xyang.me',
    date: '2026-02-08',
    description: 'Introducing my portfolio site built with React, Vite, and Tailwind v4. A technical overview of the architecture and content pipeline.',
    tags: ['meta', 'react', 'vite'],
  },
]

export default function PostsPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-bold mb-2">
        <span className="gradient-brand-text">Posts</span>
      </h1>
      <p className="text-slate-400 mb-8">Technical writing, research notes, and tutorials.</p>

      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/posts/${post.slug}`}
            className="block p-6 rounded-xl border border-navy-lighter bg-navy-light/50 hover:border-crimson/20 transition-all group"
          >
            <h2 className="text-xl font-semibold group-hover:text-crimson transition-colors">
              {post.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Tag size={14} />
                {post.tags.join(', ')}
              </span>
            </div>
            <p className="text-slate-400 mt-3 text-sm">{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
