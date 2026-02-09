import { Github, Linkedin, Globe, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-navy-lighter mt-16 py-8">
      <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Xingfu Yang. Built with React, Vite & Tailwind.
        </p>
        <div className="flex items-center gap-4">
          <a href="https://github.com/XingfuY" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-crimson transition-colors" aria-label="GitHub">
            <Github size={16} />
          </a>
          <a href="https://www.linkedin.com/in/xingfu-yang-phd-6b321262/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-crimson transition-colors" aria-label="LinkedIn">
            <Linkedin size={16} />
          </a>
          <a href="https://transinfer.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-crimson transition-colors" aria-label="TransInfer">
            <Globe size={16} />
          </a>
          <a href="mailto:xingfu@xyang.me" className="text-slate-500 hover:text-crimson transition-colors" aria-label="Email">
            <Mail size={16} />
          </a>
        </div>
      </div>
    </footer>
  )
}
