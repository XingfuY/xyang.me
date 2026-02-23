import MarkdownRenderer from '../components/MarkdownRenderer.tsx'
import { useSEO } from '../hooks/useSEO'

export default function AboutPage() {
  useSEO({
    title: 'About',
    description: 'Xingfu Yang — bio, research philosophy, and career timeline. Hardware-aware AI researcher with a PhD in Chemical Engineering.',
    path: '/about',
  })

  return (
    <div className="animate-fade-in max-w-3xl">
      <MarkdownRenderer src="/content/about.md" />
    </div>
  )
}
