import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'What is your primary technical focus?',
    answer: 'I build production ML systems from zero — scoring, ranking, classification, personalization, and GenAI applications at scale. My work spans the full lifecycle: data pipelines, model development, experimentation, deployment, and monitoring. I\'ve done this twice as a founding data scientist at startups, and I bring PhD-level statistical rigor to every system I build.',
  },
  {
    question: 'What kind of roles are you interested in?',
    answer: 'I\'m looking for Senior Data Scientist, ML Engineer, or Applied Scientist roles where I can build and ship — ideally at companies that value both research depth and production pragmatism. I\'m especially drawn to teams solving hard applied problems: scoring and recommendation systems, fraud detection, GenAI and agentic AI, or experimentation at scale. I thrive in 0-to-1 environments but I\'m equally excited by scaling established systems.',
  },
  {
    question: 'What is MiniLM?',
    answer: 'MiniLM is my flagship personal project: a foundation language model built entirely from scratch in JAX. It features multi-device sharded pretraining of a Mixture-of-Experts Transformer on OpenWebText, with a full post-training pipeline — supervised fine-tuning, reward modeling, and RLHF alignment via PPO, DPO, and GRPO. I built it on Google\'s TPU Research Cloud because I wanted to understand foundation models at the architecture level, not just the API.',
  },
  {
    question: 'What sets you apart from other data scientists?',
    answer: 'Two things: First, I\'ve built data science orgs from zero — twice. That means I didn\'t just train models, I defined what to measure, designed the pipelines, built the evaluation frameworks, and shipped everything end-to-end. Second, I go deeper than most applied scientists — I\'ve trained a foundation model from scratch and scaled graph neural networks to 1.6 billion edges. That depth means I can diagnose problems that surface-level practitioners miss.',
  },
  {
    question: 'What is your educational background?',
    answer: 'I hold a PhD in Chemical Engineering (Computational Physics) from Colorado School of Mines (GPA: 3.86/4.00), where I developed stochastic simulations and published in Physical Review Letters. I\'ve complemented this with graduate-level coursework from Stanford (CS336 — Language Modeling, CS236 — Deep Generative Models, CS224W — ML with Graphs) and Berkeley (CS182 — Deep Learning, CS285 — Deep RL).',
  },
  {
    question: 'Can I download your CV?',
    answer: 'Yes! Visit the CV page where you can submit your email to access a downloadable PDF version along with a fully rendered web version of my resume.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
}

export default function FAQPage() {
  useSEO({
    title: 'FAQ',
    description: 'Frequently asked questions about Xingfu Yang — technical focus, roles, MiniLM, differentiation, and education.',
    path: '/faq',
    jsonLd: faqJsonLd,
  })

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="text-4xl font-bold mb-2">
        <span className="gradient-brand-text">FAQ</span>
      </h1>
      <p className="text-slate-400 mb-8">Frequently asked questions about my work and background.</p>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="rounded-xl border border-navy-lighter bg-navy-light/50 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-navy-lighter/30 transition-colors"
            >
              <span className="font-semibold pr-4">{faq.question}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-400 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
