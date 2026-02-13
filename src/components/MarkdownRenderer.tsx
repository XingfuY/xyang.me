import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  src?: string
  content?: string
}

export default function MarkdownRenderer({ src, content: rawContent }: MarkdownRendererProps) {
  const [fetched, setFetched] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!src || rawContent) return
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${src} (${res.status})`)
        return res.text()
      })
      .then(setFetched)
      .catch((err) => setError(err.message))
  }, [src, rawContent])

  if (error) {
    return <p className="text-danger">Error loading content: {error}</p>
  }

  const content = rawContent ?? fetched
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
