export default function AboutPage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">
        <span className="gradient-brand-text">About</span>
      </h1>

      <section className="space-y-6 text-slate-300 leading-relaxed">
        <p>
          I'm <strong className="text-slate-100">Xingfu Yang</strong>, a Chief Data Scientist based in Los Angeles
          with a PhD in Chemical Engineering from Colorado School of Mines. My career sits at the intersection of
          frontier AI research and practical, scalable engineering.
        </p>

        <p>
          At <strong className="text-slate-100">Lucid Intel</strong>, I lead a team developing core data products —
          lead acquisition, non-credit underwriting, and high-frequency fraud prevention — leveraging
          unsupervised and supervised deep learning on 40M+ identities and billions of records. I also
          co-created a new business division: an advanced aggregated data analytics platform offering
          managed agency-of-record services.
        </p>

        <h2 className="text-2xl font-semibold text-slate-100 pt-4">Philosophy</h2>
        <p>
          I believe the most impactful AI work happens when you understand the hardware as deeply as the
          algorithms. Whether it's composing parallelism strategies for training on supercomputers or
          optimizing CUDA kernels for inference, I operate across every layer of the stack.
        </p>
        <p>
          My mindset is <em>exploration vs. exploitation</em> — knowing when to invest in research and
          when to ship. Six years of industrial experience have taught me that the best systems emerge
          from balancing theoretical rigor with pragmatic engineering.
        </p>

        <h2 className="text-2xl font-semibold text-slate-100 pt-4">Research Interests</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Deep Learning Frontier: Graph &amp; Relational Learning, GenAI, Reinforcement Learning</li>
          <li>Hardware-aware training: JAX on TPU Research Cloud, CUDA, Triton, NCCL</li>
          <li>Scaling laws and parallelism strategies for large model training</li>
          <li>Post-training: SFT, reward modeling, RLHF with PPO, DPO, and GRPO</li>
        </ul>

        <h2 className="text-2xl font-semibold text-slate-100 pt-4">Education</h2>
        <div className="p-4 rounded-lg border border-navy-lighter bg-navy-light/30">
          <p className="font-semibold">Colorado School of Mines</p>
          <p className="text-sm text-slate-400">PhD in Chemical Engineering &bull; GPA: 3.86/4.00</p>
          <p className="text-sm text-slate-400">Thesis: Out-of-equilibrium behavior of colloidal particles in AC electric fields</p>
        </div>

        <h2 className="text-2xl font-semibold text-slate-100 pt-4">Coursework</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'Language Modeling from Scratch (Stanford CS336)',
            'Deep Generative Models (Stanford CS236)',
            'Deep Learning (Berkeley CS182)',
            'Deep Reinforcement Learning (Berkeley CS285)',
            'ML with Graphs (Stanford CS224W)',
            'Intro to Computer Systems (CMU 15-213)',
            'Concurrent & Distributed Systems (Cambridge)',
          ].map((course) => (
            <span key={course} className="px-3 py-1 rounded-full text-xs bg-navy-lighter text-slate-300 border border-navy-lighter">
              {course}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
