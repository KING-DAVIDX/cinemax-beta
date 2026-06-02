'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Film, TrendingUp, Clock, Download, Home, X, Menu, Compass, LogIn } from 'lucide-react'
import { useAuth, userInitial } from '@/hooks/useAuth'

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
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
        scrolled
          ? 'bg-cx-dark/95 backdrop-blur-md border-b border-cx-muted/50 py-3'
          : 'bg-cx-black/45 backdrop-blur-sm py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Film className="text-cx-accent" size={22} />
          <span
            className="font-display text-2xl text-white"
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

        <div className="hidden md:flex shrink-0 items-center">
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
          className="md:hidden text-white/70 hover:text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-cx-dark/98 backdrop-blur-lg border-b border-cx-muted/50 px-4 py-4 flex flex-col gap-3">
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
      )}
    </nav>
  )
}
