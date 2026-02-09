import { useParams, Link } from 'react-router-dom'
import { Tag } from 'lucide-react'

const allTags = [
  { name: 'JAX', count: 3 },
  { name: 'CUDA', count: 2 },
  { name: 'Distributed Training', count: 3 },
  { name: 'GNN', count: 2 },
  { name: 'Transformer', count: 2 },
  { name: 'RLHF', count: 1 },
  { name: 'PyTorch', count: 2 },
  { name: 'TensorFlow', count: 1 },
  { name: 'TPU', count: 1 },
  { name: 'Scaling Laws', count: 1 },
  { name: 'AutoML', count: 1 },
  { name: 'Reinforcement Learning', count: 2 },
  { name: 'Deep Learning', count: 4 },
  { name: 'Graph Analytics', count: 2 },
]

export default function TagsPage() {
  const { tag } = useParams<{ tag: string }>()

  if (tag) {
    return (
      <div className="animate-fade-in">
        <Link to="/tags" className="text-slate-400 hover:text-crimson transition-colors text-sm mb-4 inline-block">
          &larr; All Tags
        </Link>
        <h1 className="text-4xl font-bold mb-8">
          <span className="gradient-brand-text">#{tag}</span>
        </h1>
        <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
          <p className="text-slate-400">
            Content tagged with <code className="text-crimson">{tag}</code> will appear here once the content pipeline is active.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-bold mb-2">
        <span className="gradient-brand-text">Tags</span>
      </h1>
      <p className="text-slate-400 mb-8">Browse content by topic.</p>

      <div className="flex flex-wrap gap-3">
        {allTags
          .sort((a, b) => b.count - a.count)
          .map(({ name, count }) => (
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
    </div>
  )
}
