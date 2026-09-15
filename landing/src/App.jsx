import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Features from './pages/Features.jsx'
import Faq from './pages/Faq.jsx'
import Contact from './pages/Contact.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import DeleteAccount from './pages/DeleteAccount.jsx'
import NotFound from './pages/NotFound.jsx'

/* Runs after each page's own useSeo (which resets scroll to top) so an
   in-page anchor like /#how-it-works still lands on the right section. */
function ScrollToHash() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
    return () => clearTimeout(timer)
  }, [hash])
  return null
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ScrollToHash />
    </Layout>
  )
}
