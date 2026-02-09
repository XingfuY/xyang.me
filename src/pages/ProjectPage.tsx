import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link to="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-crimson transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Projects
      </Link>

      <h1 className="text-4xl font-bold mb-4">
        <span className="gradient-brand-text">{slug}</span>
      </h1>

      <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
        <p className="text-slate-400">
          Project content will be loaded from the content pipeline.
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Add a project manifest at <code className="text-crimson">content/projects/{slug}.yaml</code> to populate this page.
        </p>
      </div>
    </div>
  )
}
