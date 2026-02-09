import MarkdownRenderer from '../components/MarkdownRenderer.tsx'

export default function AboutPage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <MarkdownRenderer src="/content/about.md" />
    </div>
  )
}
