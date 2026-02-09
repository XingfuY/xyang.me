import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import MatrixBackground from './components/MatrixBackground.tsx'
import Sidebar from './components/Sidebar.tsx'
import Footer from './components/Footer.tsx'
import ScrollToTop from './components/ScrollToTop.tsx'
import HomePage from './pages/HomePage.tsx'

const AboutPage = lazy(() => import('./pages/AboutPage.tsx'))
const CVPage = lazy(() => import('./pages/CVPage.tsx'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage.tsx'))
const ProjectPage = lazy(() => import('./pages/ProjectPage.tsx'))
const PostsPage = lazy(() => import('./pages/PostsPage.tsx'))
const PostPage = lazy(() => import('./pages/PostPage.tsx'))
const SearchPage = lazy(() => import('./pages/SearchPage.tsx'))
const TagsPage = lazy(() => import('./pages/TagsPage.tsx'))
const FAQPage = lazy(() => import('./pages/FAQPage.tsx'))

function PageLoader() {
  return <div className="animate-pulse-slow text-slate-500">Loading...</div>
}

export default function App() {
  return (
    <>
      <MatrixBackground />
      <Sidebar />
      <ScrollToTop />

      <main className="relative z-10 md:ml-60 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/cv" element={<CVPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectPage />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="/posts/:slug" element={<PostPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/tags/:tag" element={<TagsPage />} />
            <Route path="/faq" element={<FAQPage />} />
          </Routes>
          </Suspense>
          <Footer />
        </div>
      </main>
    </>
  )
}
