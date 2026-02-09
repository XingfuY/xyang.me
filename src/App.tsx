import { Routes, Route } from 'react-router-dom'
import MatrixBackground from './components/MatrixBackground.tsx'
import Sidebar from './components/Sidebar.tsx'
import Footer from './components/Footer.tsx'
import ScrollToTop from './components/ScrollToTop.tsx'
import HomePage from './pages/HomePage.tsx'
import AboutPage from './pages/AboutPage.tsx'
import CVPage from './pages/CVPage.tsx'
import ProjectsPage from './pages/ProjectsPage.tsx'
import ProjectPage from './pages/ProjectPage.tsx'
import PostsPage from './pages/PostsPage.tsx'
import PostPage from './pages/PostPage.tsx'
import SearchPage from './pages/SearchPage.tsx'
import TagsPage from './pages/TagsPage.tsx'
import FAQPage from './pages/FAQPage.tsx'

export default function App() {
  return (
    <>
      <MatrixBackground />
      <Sidebar />
      <ScrollToTop />

      <main className="relative z-10 md:ml-60 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
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
          <Footer />
        </div>
      </main>
    </>
  )
}
