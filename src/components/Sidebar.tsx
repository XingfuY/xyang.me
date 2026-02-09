import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, Home, User, FileText, FolderOpen, PenLine, Search, Tags, HelpCircle, Github, Linkedin, Mail } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/about', label: 'About', icon: User },
  { to: '/cv', label: 'CV', icon: FileText },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/posts', label: 'Posts', icon: PenLine },
  { to: '/tags', label: 'Tags', icon: Tags },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
]

const socialLinks = [
  { href: 'https://github.com/XingfuY', icon: Github, label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/xingfu-yang-phd-6b321262/', icon: Linkedin, label: 'LinkedIn' },
  { href: 'mailto:xingfu@xyang.me', icon: Mail, label: 'Email' },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-navy-light/80 backdrop-blur-sm border border-navy-lighter hover:border-crimson/30 transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-navy-light/95 backdrop-blur-sm border-r border-navy-lighter
          flex flex-col z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo / Avatar */}
        <div className="p-6 border-b border-navy-lighter">
          <NavLink to="/" onClick={() => setIsOpen(false)} className="block">
            <h1 className="text-xl font-bold gradient-brand-text">Xingfu Yang</h1>
            <p className="text-xs text-slate-400 mt-1">Chief Data Scientist</p>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'active bg-navy-lighter/50'
                        : 'text-slate-300 hover:bg-navy-lighter/30'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Social links */}
        <div className="p-4 border-t border-navy-lighter">
          <div className="flex items-center justify-center gap-4">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-crimson transition-colors"
                aria-label={label}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}
