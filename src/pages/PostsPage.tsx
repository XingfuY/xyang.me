import { Link } from 'react-router-dom'
import { Calendar, Tag } from 'lucide-react'
import manifest from '../generated/content-manifest.json'

interface Post {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
}

const posts: Post[] = manifest.posts as Post[]

export default function PostsPage() {
  if (posts.length === 0) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold mb-2">
          <span className="gradient-brand-text">Posts</span>
        </h1>
        <p className="text-slate-400 mb-8">Technical writing, research notes, and tutorials.</p>
        <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
          <p className="text-slate-400">No posts yet. Check back soon!</p>
        </div>
      </div>
    )
  }

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
