import { Link } from 'react-router-dom'
import { ExternalLink, Github } from 'lucide-react'

interface Project {
  slug: string
  title: string
  description: string
  tags: string[]
  repo?: string
  featured?: boolean
}

const projects: Project[] = [
  {
    slug: 'minilm',
    title: 'MiniLM',
    description: 'A minimal JAX incarnation of full life cycle modern language model from scratch. Multi-device sharded pretraining of a Mixture-of-Experts foundation model with data and tensor parallelism on TPU Research Cloud.',
    tags: ['JAX', 'TPU', 'MoE', 'RLHF', 'Distributed Training'],
    repo: 'XingfuY/MiniLM',
    featured: true,
  },
  {
    slug: 'relational-learning',
    title: 'RelationalLearning',
    description: 'Scaling up GNNs with GraphStore and FeatureStore via Remote Backends. Trained a GraphSAGE model on a 100 million nodes and 1.6 billion edges graph.',
    tags: ['GNN', 'PyTorch Geometric', 'GraphSAGE', 'Distributed'],
    repo: 'XingfuY/RelationalLearning',
    featured: true,
  },
]

export default function ProjectsPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-bold mb-2">
        <span className="gradient-brand-text">Projects</span>
      </h1>
      <p className="text-slate-400 mb-8">Open source work and research projects.</p>

      <div className="grid gap-6">
        {projects.map((project) => (
          <Link
            key={project.slug}
            to={`/projects/${project.slug}`}
            className="block p-6 rounded-xl border border-navy-lighter bg-navy-light/50 hover:border-crimson/20 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold group-hover:text-crimson transition-colors">
                  {project.title}
                </h2>
                <p className="text-slate-400 mt-2 text-sm leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded text-xs bg-navy-lighter text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {project.repo && (
                  <span className="text-slate-500 group-hover:text-crimson transition-colors">
                    <Github size={18} />
                  </span>
                )}
                <span className="text-slate-500 group-hover:text-crimson transition-colors">
                  <ExternalLink size={18} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
