import { ArrowRight, Cpu, Brain, Network, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import TechGlobe from '../components/TechGlobe.tsx'

const highlights = [
  {
    icon: Cpu,
    title: 'Hardware-Aware AI',
    description: 'CUDA, Triton, NCCL — developing solutions mindful of hardware characteristics and algorithm constraints.',
  },
  {
    icon: Brain,
    title: 'JAX + Distributed Training',
    description: 'Multi-device sharded pretraining of MoE foundation models with data and tensor parallelism on TPU/GPU clusters.',
  },
  {
    icon: Network,
    title: 'Graph Neural Networks',
    description: 'Scaling GNNs to 100M+ nodes and 1.6B edges via remote-backed GraphStore and FeatureStore.',
  },
  {
    icon: Zap,
    title: 'Full-Stack ML',
    description: 'From scaling laws and RLHF to production serving — 6+ years shipping deep learning systems end-to-end.',
  },
]

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col justify-center py-12">
        <div className="max-w-4xl">
          <p className="text-crimson font-mono text-sm mb-4 tracking-wider uppercase">
            Chief Data Scientist
          </p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-brand-text">Xingfu Yang</span>
            <span className="text-slate-300">, PhD</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
            Hardware-aware AI researcher building frontier deep learning systems —
            from scaling laws to production, across every layer of the stack.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/projects"
              className="gradient-brand px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              View Projects <ArrowRight size={18} />
            </Link>
            <Link
              to="/cv"
              className="px-6 py-3 rounded-lg font-semibold border border-slate-600 text-slate-200 hover:border-crimson/50 hover:text-white transition-all"
            >
              Download CV
            </Link>
          </div>
        </div>
      </section>

      {/* Tech Globe */}
      <section className="py-12">
        <h2 className="text-2xl font-bold mb-2 text-center">Technical Expertise</h2>
        <p className="text-slate-400 text-center mb-8 text-sm">Click a keyword to search related content</p>
        <div className="h-[400px] md:h-[500px] max-w-2xl mx-auto">
          <TechGlobe />
        </div>
      </section>

      {/* Highlights */}
      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8">Highlights</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-6 rounded-xl border border-navy-lighter bg-navy-light/50 hover:border-crimson/20 transition-colors"
            >
              <Icon size={24} className="text-crimson mb-3" />
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
