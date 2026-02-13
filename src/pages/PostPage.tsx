import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import MarkdownRenderer from '../components/MarkdownRenderer.tsx'
import manifest from '../generated/content-manifest.json'

interface Post {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
}

const posts: Post[] = manifest.posts as Post[]

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = posts.find((p) => p.slug === slug)

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link to="/posts" className="inline-flex items-center gap-2 text-slate-400 hover:text-crimson transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Posts
      </Link>

      {post ? (
        <>
          <h1 className="text-4xl font-bold mb-3">
            <span className="gradient-brand-text">{post.title}</span>
          </h1>
          <div className="flex items-center gap-4 mb-8 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Tag size={14} />
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/tags/${tag}`}
                  className="hover:text-crimson transition-colors"
                >
                  {tag}
                </Link>
              )).reduce<React.ReactNode[]>((acc, el, i) => {
                if (i > 0) acc.push(', ')
                acc.push(el)
                return acc
              }, [])}
            </span>
          </div>
          <MarkdownRenderer src={`/content/posts/${slug}.md`} />
        </>
      ) : (
        <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
          <p className="text-slate-400">Post not found.</p>
          <p className="text-slate-500 text-sm mt-2">
            No post with slug <code className="text-crimson">{slug}</code> exists.
          </p>
        </div>
      )}
    </div>
  )
}
