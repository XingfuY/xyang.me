import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Github } from 'lucide-react'
import MarkdownRenderer from '../components/MarkdownRenderer.tsx'
import manifest from '../generated/content-manifest.json'

interface Project {
  slug: string
  title: string
  description: string
  tags: string[]
  repo?: string
  featured?: boolean
  hasContent?: boolean
}

const projects: Project[] = manifest.projects as Project[]

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>()
  const project = projects.find((p) => p.slug === slug)

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link to="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-crimson transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Projects
      </Link>

      {project ? (
        <>
          <h1 className="text-4xl font-bold mb-3">
            <span className="gradient-brand-text">{project.title}</span>
          </h1>
          <p className="text-slate-400 mb-4 leading-relaxed">{project.description}</p>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {project.tags.map((tag) => (
              <Link
                key={tag}
                to={`/tags/${tag}`}
                className="px-2 py-0.5 rounded text-xs bg-navy-lighter text-slate-300 hover:text-crimson transition-colors"
              >
                {tag}
              </Link>
            ))}
            {project.repo && (
              <a
                href={`https://github.com/${project.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-crimson transition-colors"
              >
                <Github size={14} />
                {project.repo}
              </a>
            )}
          </div>
          {project.hasContent ? (
            <MarkdownRenderer src={`/content/projects/${slug}.md`} />
          ) : (
            <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
              <p className="text-slate-400">Detailed writeup coming soon.</p>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50 text-center">
          <p className="text-slate-400">Project not found.</p>
          <p className="text-slate-500 text-sm mt-2">
            No project with slug <code className="text-crimson">{slug}</code> exists.
          </p>
        </div>
      )}
    </div>
  )
}
