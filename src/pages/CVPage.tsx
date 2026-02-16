import { useState, useRef } from 'react'
import { FileDown, Mail, Lock, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react'
import { submitLead } from '../lib/submitLead'

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export default function CVPage() {
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
            href="/cv.pdf"
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
                <li className="flex gap-2"><span className="text-crimson mt-1">&#x2022;</span>Accomplished Founding Data Scientist with extensive startup experience, spearheading development of innovative data products from ideation to scalable profitable businesses.</li>
                <li className="flex gap-2"><span className="text-crimson mt-1">&#x2022;</span>Hardware-aware AI Researcher with a solid track record of developing innovative solutions and conducting open-ended research, mindful of hardware characteristics and algorithm constraints.</li>
                <li className="flex gap-2"><span className="text-crimson mt-1">&#x2022;</span>Abreast of latest algorithmic advances, experienced in refining scaling laws and composing different parallelism strategies when training massive datasets on supercomputers.</li>
                <li className="flex gap-2"><span className="text-crimson mt-1">&#x2022;</span>Proficient in high-level system design to hands-on development of quality distributed deep learning systems with 6+ years of industrial experience.</li>
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
                  <p className="text-sm text-crimson">Chief Data Scientist</p>
                  <span className="text-sm text-slate-500">Jun 2023 — Present</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>&#x2022; Leading team developing core data products: lead acquisition, non-credit underwriting, and high-frequency fraud prevention on 40M identities and billions of records.</li>
                  <li>&#x2022; Spearheading AutoML-based platform to accommodate various client demands through project scoping, customized modeling and continuous iteration.</li>
                  <li>&#x2022; Co-created a new business division — an advanced aggregated data analytics platform offering managed agency of record services.</li>
                </ul>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <h3 className="text-lg font-semibold">Leap Theory</h3>
                  <span className="text-sm text-slate-400">Los Angeles, CA</span>
                </div>
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <p className="text-sm text-crimson">Data Scientist</p>
                  <span className="text-sm text-slate-500">Oct 2019 — Jun 2023</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>&#x2022; Orchestrated non-credit transformer-based aggregated models for InsightEngine to serve key lending underwriting metrics in production.</li>
                  <li>&#x2022; Achieved a 55% reduction in unnecessary traffic, a 70% increase in accept ratio, and a 2-10pp decrease in first payment default.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b border-navy-lighter pb-2 mb-4">Independent Projects</h2>

              <div className="mb-4">
                <h3 className="font-semibold">MiniLM: Minimal JAX incarnation of full life cycle modern LM from scratch</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  <li>&#x2022; TPU Research Cloud Project: multi-device sharded pretraining of a Mixture-of-Experts foundation model using OpenWebText with data and tensor parallelism.</li>
                  <li>&#x2022; Post-training: SFT, reward modeling, followed by RLHF with PPO, DPO, and GRPO.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold">RelationalLearning: Scaling up GNNs with GraphStore and FeatureStore via Remote Backends</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  <li>&#x2022; Trained a GraphSAGE model on a 100 million nodes and 1.6 billion edges graph DB backing dataset.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b border-navy-lighter pb-2 mb-4">Expertise</h2>
              <div className="space-y-3 text-sm">
                <div><strong className="text-slate-200">ML Frameworks:</strong> <span className="text-slate-400">JAX, TensorFlow, PyTorch [Geometric], Triton, Keras, XGBoost, Scikit-Learn, AutoGluon</span></div>
                <div><strong className="text-slate-200">C/C++ Stack:</strong> <span className="text-slate-400">CUDA, NCCL, MPI, OpenMP, libuv, Boost, gRPC, protobuf, MySQL, Hiredis</span></div>
                <div><strong className="text-slate-200">Python Libs:</strong> <span className="text-slate-400">FastAPI, Django, Flask, Gunicorn, SQLAlchemy, NumPy, Numba, Dask, Pandas</span></div>
                <div><strong className="text-slate-200">Orchestration:</strong> <span className="text-slate-400">Kubernetes, Ray, Slurm, Kubeflow, Airflow, Docker, TFX, Prometheus, Grafana</span></div>
                <div><strong className="text-slate-200">Cloud:</strong> <span className="text-slate-400">GKE Architect, AWS SA Associate</span></div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
