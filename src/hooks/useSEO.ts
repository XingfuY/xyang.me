import { useEffect } from 'react'

interface SEOProps {
  title: string
  description: string
  path: string
  type?: string
  jsonLd?: object
}

const SITE = 'https://xyang.me'
const SUFFIX = ' | xyang.me'
const DEFAULT_TITLE = 'Xingfu Yang — Chief Data Scientist'
const DEFAULT_DESC = 'Xingfu Yang, PhD — Chief Data Scientist specializing in JAX, CUDA, distributed systems, and frontier AI research.'

function setMeta(attr: string, value: string, content: string) {
  const el = document.querySelector(`meta[${attr}="${value}"]`)
  if (el) el.setAttribute('content', content)
}

function findOrCreate<K extends keyof HTMLElementTagNameMap>(
  selector: string,
  tag: K,
  attrs: Record<string, string>,
): HTMLElementTagNameMap[K] {
  let el = document.querySelector<HTMLElementTagNameMap[K]>(selector)
  if (!el) {
    el = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    document.head.appendChild(el)
  }
  return el
}

export function useSEO({ title, description, path, type = 'website', jsonLd }: SEOProps) {
  useEffect(() => {
    const fullTitle = title === DEFAULT_TITLE ? title : title + SUFFIX
    const url = SITE + path

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', type)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)

    const canonical = findOrCreate<'link'>('link[rel="canonical"]', 'link', { rel: 'canonical' })
    canonical.setAttribute('href', url)

    let scriptEl: HTMLScriptElement | null = null
    if (jsonLd) {
      scriptEl = findOrCreate<'script'>('script[type="application/ld+json"]', 'script', { type: 'application/ld+json' })
      scriptEl.textContent = JSON.stringify(jsonLd)
    }

    return () => {
      document.title = DEFAULT_TITLE
      setMeta('name', 'description', DEFAULT_DESC)
      setMeta('property', 'og:title', DEFAULT_TITLE)
      setMeta('property', 'og:description', DEFAULT_DESC)
      setMeta('property', 'og:url', SITE)
      setMeta('property', 'og:type', 'website')
      setMeta('name', 'twitter:title', DEFAULT_TITLE)
      setMeta('name', 'twitter:description', DEFAULT_DESC)
      const c = document.querySelector('link[rel="canonical"]')
      if (c) c.setAttribute('href', SITE + '/')
      if (scriptEl) { scriptEl.remove(); scriptEl = null }
    }
  }, [title, description, path, type, jsonLd])
}
