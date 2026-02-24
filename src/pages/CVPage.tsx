import { useState, useRef } from 'react'
import { FileDown, Mail, Lock, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react'
import { submitLead } from '../lib/submitLead'
import { useSEO } from '../hooks/useSEO'

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export default function CVPage() {
  useSEO({
    title: 'CV',
    description: 'Curriculum vitae of Xingfu Yang — work experience, independent projects, and technical expertise in AI/ML.',
    path: '/cv',
  })

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const mountTime = useRef(Date.now())

  function validateEmail(value: string) {
    if (!value) return 'Email is required'
    if (!EMAIL_RE.test(value)) return 'Please enter a valid email'
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Honeypot check — bots fill hidden fields
    if (honeypot) return

    // Timing check — reject instant submissions (< 2s)
    if (Date.now() - mountTime.current < 2000) return

    const error = validateEmail(email)
    if (error) {
      setEmailError(error)
      return
    }

    if (!verified) {
      setEmailError('Please verify you are human')
      return
    }

    setLoading(true)

    try {
      await submitLead('cv_leads', { email })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">
        <span className="gradient-brand-text">Curriculum Vitae</span>
      </h1>

      {!submitted ? (
        <div className="p-8 rounded-xl border border-navy-lighter bg-navy-light/50">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} className="text-crimson" />
            <h2 className="text-xl font-semibold">Access My Full CV</h2>
          </div>
          <p className="text-slate-400 mb-6">
            Enter your email to download my full resume as PDF and view the rendered version below.
            Your email will only be used for professional networking.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError(validateEmail(e.target.value))
                    }}
                    onBlur={() => { if (email) setEmailError(validateEmail(email)) }}
                    placeholder="you@company.com"
                    required
                    className={`w-full px-4 py-3 rounded-lg bg-navy border text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors ${
                      emailError
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-navy-lighter focus:border-crimson/50'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-brand px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  <Mail size={18} />
                  {loading ? 'Sending...' : 'Submit'}
                </button>
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  {emailError}
                </p>
              )}
            </div>

            {/* Human verification checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                verified
                  ? 'bg-crimson/20 border-crimson'
                  : 'border-slate-600 group-hover:border-slate-400'
              }`}>
                {verified && <ShieldCheck size={14} className="text-crimson" />}
              </div>
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => {
                  setVerified(e.target.checked)
                  if (e.target.checked && emailError === 'Please verify you are human') setEmailError('')
                }}
                className="sr-only"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                I'm human
              </span>
            </label>

            {/* Honeypot — invisible to humans, bots auto-fill */}
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
              style={{ position: 'absolute', left: '-9999px' }}
            />
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="p-6 rounded-xl border border-success/30 bg-success/5 flex items-center gap-3">
            <CheckCircle size={24} className="text-success" />
            <div>
              <p className="font-semibold text-success">Access Granted</p>
              <p className="text-sm text-slate-400">Thank you! You can now view and download the CV.</p>
            </div>
          </div>

          <a
            href="/cv_portfolio.pdf"
            download
            className="gradient-brand inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <FileDown size={18} />
            Download CV (PDF)
          </a>

          {/* Rendered CV content */}
          <div className="space-y-8 mt-8">
            <section>
              <h2 className="text-2xl font-bold border-b border-navy-lighter pb-2 mb-4">Highlights</h2>
              <ul className="space-y-3 text-slate-300">
                <li className="flex gap-2"><span className="text-crimson mt-1">&#x2022;</span><strong>Founding Data Scientist</strong> who builds from zero — production systems, experimentation frameworks, evaluation pipelines, and the teams around them. Built data science from scratch at two startups, turning ambiguous problems into measurable outcomes.</li>
                <li className="flex gap-2"><span className="text-crimson mt-1">&#x2022;</span>PhD-trained <strong>applied scientist</strong>: scoring, ranking, classification, fraud detection, personalization, and GenAI at scale (40M+ entities, billions of records). Full ML lifecycle from research to production monitoring.</li>
                <li className="flex gap-2"><span className="text-crimson mt-1">&#x2022;</span><strong>Research depth meets production pragmatism</strong>: trained a foundation model from scratch on TPUs, scaled GNNs to 1.6B edges, completed advanced coursework from Stanford and Berkeley. 6 years balancing scientific rigor with building systems that ship.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b border-navy-lighter pb-2 mb-4">Work Experience</h2>

              <div className="mb-6">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <h3 className="text-lg font-semibold">Lucid Intel</h3>
                  <span className="text-sm text-slate-400">Santa Monica, CA</span>
                </div>
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <p className="text-sm text-crimson italic">Chief Data Scientist</p>
                  <span className="text-sm text-slate-500">Jun 2023 — Feb 2026</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>&#x2022; Built the data science function from zero: defined metrics, designed pipelines, built evaluation frameworks, and delivered actionable insights that shaped product roadmap and business strategy.</li>
                  <li>&#x2022; Designed, trained, and deployed scoring, classification, and fraud detection models on 40M+ identities and billions of records — supervised and unsupervised deep learning with rigorous evaluation and production monitoring.</li>
                  <li>&#x2022; Led A/B experimentation programs: designed controlled experiments, conducted causal analysis, and translated complex results into clear, data-driven recommendations for cross-functional teams.</li>
                  <li>&#x2022; Built LLM-based production systems — agentic workflows, RAG pipelines, and generative applications. Developed evaluation benchmarks to measure quality and identify failure modes.</li>
                </ul>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <h3 className="text-lg font-semibold">Leap Theory</h3>
                  <span className="text-sm text-slate-400">Los Angeles, CA</span>
                </div>
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <p className="text-sm text-crimson italic">Data Scientist</p>
                  <span className="text-sm text-slate-500">Oct 2019 — Jun 2023</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>&#x2022; Built production ML systems from scratch: scoring, classification, and recommendation models with tiered caching for high-throughput, low-latency serving.</li>
                  <li>&#x2022; Achieved a 55% reduction in noise, 70% increase in accept ratio, and 2–10 pp improvement in first-payment default through rigorous feature engineering and model iteration.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b border-navy-lighter pb-2 mb-4">Independent Projects</h2>

              <div className="mb-4">
                <h3 className="font-semibold">MiniLM: Foundation Model from Scratch (JAX / Google TPU Research Cloud)</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  <li>&#x2022; Multi-device sharded pretraining of a Mixture-of-Experts foundation model using the OpenWebText dataset with data and tensor parallelism.</li>
                  <li>&#x2022; Post-training: supervised fine-tuning, reward modeling, and RLHF alignment via PPO, DPO, and GRPO.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold">Scaling GNNs to Billion-Edge Graphs (PyTorch / PyG)</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  <li>&#x2022; Trained GraphSAGE on a 100 million node, 1.6 billion edge graph — scalable representation learning and pattern discovery on large-scale relational data.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b border-navy-lighter pb-2 mb-4">Expertise</h2>
              <div className="space-y-3 text-sm">
                <div><strong className="text-slate-200">Applied ML:</strong> <span className="text-slate-400">Scoring, Ranking, Classification, Fraud Detection, Personalization, A/B Testing, Causal Inference, Evaluation Frameworks</span></div>
                <div><strong className="text-slate-200">ML Frameworks:</strong> <span className="text-slate-400">PyTorch, TensorFlow, JAX/FLAX, Triton, Keras, XGBoost, Scikit-Learn, AutoGluon, HuggingFace</span></div>
                <div><strong className="text-slate-200">GenAI & LLMs:</strong> <span className="text-slate-400">Transformers, RLHF (PPO, DPO, GRPO), RAG, Agentic AI, LangChain, LangGraph, Fine-Tuning (LoRA)</span></div>
                <div><strong className="text-slate-200">Languages:</strong> <span className="text-slate-400">Python (7+ yrs), SQL (7+ yrs), C/C++ (CUDA, MPI, OpenMP), R, Bash</span></div>
                <div><strong className="text-slate-200">Python Stack:</strong> <span className="text-slate-400">FastAPI, Django, Flask, Gunicorn, SQLAlchemy, NumPy, Numba, Dask, Pandas, Matplotlib, Seaborn</span></div>
                <div><strong className="text-slate-200">Orchestration:</strong> <span className="text-slate-400">Kubernetes, Ray, Slurm, Kubeflow, Airflow, Docker, TFX, TensorFlow Serving, Prometheus, Grafana</span></div>
                <div><strong className="text-slate-200">Cloud:</strong> <span className="text-slate-400">AWS Solutions Architect Associate, GCP (GKE, TPU Research Cloud, BigQuery, Vertex AI)</span></div>
                <div><strong className="text-slate-200">Coursework:</strong> <span className="text-slate-400">Language Modeling from Scratch (Stanford CS336), Deep Generative Models (Stanford CS236), Deep Learning (Berkeley CS182), Deep Reinforcement Learning (Berkeley CS285), ML with Graphs (Stanford CS224W)</span></div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b border-navy-lighter pb-2 mb-4">Research Experience</h2>

              <div className="mb-6">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <h3 className="text-lg font-semibold">Research Assistant, Colorado School of Mines</h3>
                  <span className="text-sm text-slate-400">Golden, CO</span>
                </div>
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <p className="text-sm text-crimson italic">PhD in Chemical Engineering (Computational Physics); GPA: 3.86/4.00</p>
                  <span className="text-sm text-slate-500">Aug 2013 — Aug 2019</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>&#x2022; Developed numerical simulation of patterning of non-spherical colloids under electric fields. Published in <em>Physical Review Letters</em>.</li>
                  <li>&#x2022; Teamed with collaborators to design an O(N<sub>b</sub> log N<sub>b</sub>) framework to model a large number of colloids.</li>
                  <li>&#x2022; Simulated in- and out-of-equilibrium behaviors of particles in a high-performance computing cluster.</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
