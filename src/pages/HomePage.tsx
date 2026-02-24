import { useMemo, useState, useEffect } from 'react'
import { ArrowRight, Rocket, BarChart3, Brain, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import TechGlobe from '../components/TechGlobe.tsx'
import { useSEO } from '../hooks/useSEO'

function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop'
    if (window.innerWidth >= 1024) return 'desktop'
    if (window.innerWidth >= 768) return 'tablet'
    return 'mobile'
  })
  useEffect(() => {
    const mqDesktop = window.matchMedia('(min-width: 1024px)')
    const mqTablet = window.matchMedia('(min-width: 768px)')
    const update = () => {
      if (mqDesktop.matches) setBp('desktop')
      else if (mqTablet.matches) setBp('tablet')
      else setBp('mobile')
    }
    mqDesktop.addEventListener('change', update)
    mqTablet.addEventListener('change', update)
    return () => {
      mqDesktop.removeEventListener('change', update)
      mqTablet.removeEventListener('change', update)
    }
  }, [])
  return bp
}

const highlights = [
  {
    icon: Rocket,
    title: 'Built from Zero — Twice',
    description: 'Founding data scientist at two startups — designed pipelines, shipped production ML, and built the teams around them. From zero to revenue.',
  },
  {
    icon: BarChart3,
    title: 'Production ML at Scale',
    description: 'Scoring, ranking, fraud detection, and personalization on 40M+ entities and billions of records. A/B experimentation, evaluation frameworks, and models that ship.',
  },
  {
    icon: Brain,
    title: 'Foundation Models from Scratch',
    description: 'Trained a Mixture-of-Experts Transformer end-to-end on TPUs — pretraining, SFT, reward modeling, and RLHF alignment (PPO, DPO, GRPO).',
  },
  {
    icon: GraduationCap,
    title: 'Research Depth',
    description: 'PhD in Computational Physics. Scaled GNNs to 1.6B edges. Advanced coursework from Stanford (CS336, CS236, CS224W) and Berkeley (CS182, CS285).',
  },
]

export default function HomePage() {
  const bp = useBreakpoint()
  const showGlobe = bp !== 'mobile'
  const isDesktop = bp === 'desktop'
  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Xingfu Yang',
    url: 'https://xyang.me',
    jobTitle: 'Chief Data Scientist',
    sameAs: [
      'https://github.com/XingfuY',
      'https://www.linkedin.com/in/xingfu-yang-phd-6b321262/',
    ],
  }), [])

  useSEO({
    title: 'Xingfu Yang — Hardware-Aware AI Researcher',
    description: 'Hardware-aware AI engineer building frontier deep learning systems — JAX, CUDA, Triton, distributed training, and full-stack ML.',
    path: '/',
    jsonLd,
  })

  return (
    <div className="animate-fade-in">
      {/* Hero section with globe positioned top-right */}
      <section className="min-h-screen relative py-12 flex flex-col justify-center">
        {/* Globe — absolute top-right on desktop only */}
        {isDesktop && (
          <div className="absolute top-8 right-0 w-[280px]">
            <p className="text-xs text-slate-500 text-center mb-1 uppercase tracking-widest">Stack</p>
            <div className="h-[280px]">
              <TechGlobe />
            </div>
          </div>
        )}

        {/* Hero text */}
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 whitespace-nowrap">
            <span className="gradient-brand-text">Xingfu Yang</span>
            <span className="text-slate-300">, PhD</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
            Data scientist and ML engineer who builds from zero — production systems, foundation models, and the teams around them.
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

        {/* Globe — tablet only, below hero (skipped on mobile to prevent OOM) */}
        {showGlobe && !isDesktop && (
          <div className="mt-12 mx-auto w-full max-w-[260px]">
            <p className="text-xs text-slate-500 text-center mb-1 uppercase tracking-widest">Stack</p>
            <div className="h-[240px]">
              <TechGlobe />
            </div>
          </div>
        )}
      </section>

      {/* Highlights */}
      <section className="pt-24 pb-12">
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
