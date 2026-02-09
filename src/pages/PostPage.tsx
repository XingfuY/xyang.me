import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link to="/posts" className="inline-flex items-center gap-2 text-slate-400 hover:text-crimson transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Posts
      </Link>

      <h1 className="text-4xl font-bold mb-4">
        <span className="gradient-brand-text">{slug}</span>
      </h1>

      <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
        <p className="text-slate-400">
          Post content will be loaded from the content pipeline.
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Add a markdown file at <code className="text-crimson">content/posts/{slug}.md</code> to populate this page.
        </p>
      </div>
    </div>
  )
}
