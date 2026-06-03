'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Film, TrendingUp, Clock, Download, Home, X, Menu, Compass, LogIn, MessageCircle, Shield } from 'lucide-react'
import { useAuth, userInitial } from '@/hooks/useAuth'
import { isAdminEmail, WHATSAPP_CHANNEL_URL } from '@/lib/site'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/browse', label: 'Browse', icon: Compass },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/downloads', label: 'Downloads', icon: Download },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = isAdminEmail(user?.email)
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        menuOpen || scrolled
          ? 'bg-cx-dark/95 backdrop-blur-md border-b border-cx-muted/50 py-3'
          : 'bg-cx-black/45 backdrop-blur-sm py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Film className="text-cx-accent" size={22} />
          <span
            className="font-display text-xl text-white sm:text-2xl"
          >
            CINEMAX
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 ${
                pathname === href
                  ? 'bg-cx-accent/10 text-cx-accent border border-cx-accent/25'
                  : 'text-white/58 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cx-ice/40" size={15} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search movies, series..."
              className="w-full bg-cx-navy/80 border border-cx-muted/60 text-white placeholder-white/30 rounded-lg pl-9 pr-4 py-2 text-sm font-body focus:border-cx-accent/60 focus:bg-cx-navy transition-all"
            />
          </div>
        </form>

        <div className="hidden md:flex shrink-0 items-center gap-2">
          <a
            href={WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Cinemax WhatsApp Channel"
            title="Cinemax WhatsApp Channel"
            className="grid h-9 w-9 place-items-center rounded-lg border border-cx-muted/45 bg-white/5 text-white/58 transition-all hover:border-cx-accent/35 hover:text-cx-accent"
          >
            <MessageCircle size={16} />
          </a>
          {isAdmin && (
            <Link
              href="/admin"
              aria-label="Admin"
              title="Admin"
              className={`grid h-9 w-9 place-items-center rounded-lg border transition-all ${
                pathname === '/admin'
                  ? 'border-cx-accent bg-cx-accent text-cx-black'
                  : 'border-cx-accent/30 bg-cx-accent/10 text-cx-accent hover:bg-cx-accent hover:text-cx-black'
              }`}
            >
              <Shield size={16} />
            </Link>
          )}
          {user ? (
            <Link
              href="/profile"
              aria-label="Profile"
              title="Profile"
              className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-bold transition-all ${
                pathname === '/profile'
                  ? 'border-cx-accent bg-cx-accent text-cx-black'
                  : 'border-cx-accent/35 bg-cx-accent/10 text-cx-accent hover:bg-cx-accent hover:text-cx-black'
              }`}
            >
              {userInitial(user)}
            </Link>
          ) : (
            <Link
              href="/signin"
              className="flex items-center gap-2 rounded-lg border border-cx-accent/25 bg-cx-accent/10 px-3 py-2 text-sm font-semibold text-cx-accent transition-all hover:bg-cx-accent hover:text-cx-black"
            >
              <LogIn size={15} />
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="md:hidden grid h-10 w-10 place-items-center rounded-lg border border-cx-muted/45 bg-cx-navy text-white/75 transition-all hover:border-cx-accent/35 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] max-h-[calc(100dvh-65px)] overflow-y-auto border-b border-cx-muted/60 bg-cx-dark px-4 pb-6 pt-4 shadow-2xl shadow-black/70">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.12),transparent_35%),linear-gradient(180deg,#1A1814_0%,#111009_100%)]" />
          <div className="flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cx-ice/40" size={15} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search movies, series..."
                className="w-full bg-cx-navy border border-cx-muted/60 text-white placeholder-white/30 rounded-lg pl-9 pr-4 py-2.5 text-sm font-body focus:border-cx-accent/60 transition-all"
              />
            </div>
          </form>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body font-medium transition-all ${
                pathname === href
                  ? 'bg-cx-accent/10 text-cx-accent border border-cx-accent/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
          <a
            href={WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg border border-cx-muted/40 bg-white/5 px-4 py-3 text-sm font-body font-medium text-white/62 transition-all hover:border-cx-accent/35 hover:text-cx-accent"
          >
            <MessageCircle size={17} />
            WhatsApp Channel
          </a>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body font-medium transition-all ${
                pathname === '/admin'
                  ? 'bg-cx-accent/10 text-cx-accent border border-cx-accent/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield size={17} />
              Admin
            </Link>
          )}
          {user ? (
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body font-medium transition-all ${
                pathname === '/profile'
                  ? 'bg-cx-accent/10 text-cx-accent border border-cx-accent/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-cx-accent text-xs font-bold text-cx-black">
                {userInitial(user)}
              </span>
              Profile
            </Link>
          ) : (
            <Link
              href="/signin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg border border-cx-accent/20 bg-cx-accent/10 px-4 py-3 text-sm font-body font-medium text-cx-accent transition-all hover:bg-cx-accent hover:text-cx-black"
            >
              <LogIn size={17} />
              Sign In
            </Link>
          )}
          </div>
        </div>
      )}
    </nav>
  )
}
