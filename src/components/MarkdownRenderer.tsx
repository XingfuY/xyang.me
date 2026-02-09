import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  src: string
}

export default function MarkdownRenderer({ src }: MarkdownRendererProps) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${src} (${res.status})`)
        return res.text()
      })
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [src])

  if (error) {
    return <p className="text-danger">Error loading content: {error}</p>
  }

  if (content === null) {
    return <div className="animate-pulse-slow text-slate-500">Loading...</div>
  }

  return (
    <div className="prose-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
