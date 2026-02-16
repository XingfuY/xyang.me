import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'What is your primary technical focus?',
    answer: 'I specialize in hardware-aware AI research and engineering — from JAX/CUDA kernel development to scaling distributed training systems with data and tensor parallelism on TPU/GPU clusters. My work spans the full stack: scaling laws, model architecture, training infrastructure, and production deployment.',
  },
  {
    question: 'What kind of roles are you interested in?',
    answer: 'I\'m drawn to frontier AI research and engineering roles where large-scale model training meets real-world impact — especially interdisciplinary applications where AI intersects with physics, science, and complex systems. I thrive in environments that value both theoretical depth and practical engineering excellence.',
  },
  {
    question: 'What is MiniLM?',
    answer: 'MiniLM is my flagship personal project: a minimal JAX incarnation of a full life cycle modern language model built from scratch. It features multi-device sharded pretraining of a Mixture-of-Experts foundation model using the OpenWebText dataset, with post-training via SFT, reward modeling, and RLHF (PPO, DPO, GRPO). It was developed on the TPU Research Cloud.',
  },
  {
    question: 'How do you approach scaling deep learning systems?',
    answer: 'I believe in composing parallelism strategies deliberately: data parallelism for batch scaling, tensor parallelism for model sharding, and pipeline parallelism when needed. The key is being mindful of hardware topology, communication costs, and memory hierarchies. My approach is informed by both academic research and 6+ years of shipping real systems.',
  },
  {
    question: 'What is your educational background?',
    answer: 'I hold a PhD in Chemical Engineering from Colorado School of Mines (GPA: 3.86/4.00), where I developed numerical simulations of colloidal particle patterning. I\'ve complemented this with graduate-level coursework from Stanford (CS336, CS236, CS224W), Berkeley (CS182, CS285), CMU (15-213), and Cambridge (Concurrent and Distributed Systems).',
  },
  {
    question: 'Can I download your CV?',
    answer: 'Yes! Visit the CV page where you can submit your email to access a downloadable PDF version along with a fully rendered web version of my resume.',
  },
]

export default function FAQPage() {
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
