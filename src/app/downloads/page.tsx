'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Download, Trash2, X, Film, Tv, ExternalLink } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useDownloadHistory, type DownloadHistoryItem } from '@/hooks/useHistory'

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

const qualityColor: Record<string, string> = {
  '1080p': 'text-green-400 border-green-500/30 bg-green-500/10',
  '720p': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  '480p': 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  '360p': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
}

function DownloadCard({
  item,
  onRemove,
}: {
  item: DownloadHistoryItem
  onRemove: () => void
}) {
  const qClass = qualityColor[item.quality] || 'text-cx-ice border-cx-accent/30 bg-cx-accent/10'

  return (
    <div className="group flex gap-4 bg-cx-navy/60 hover:bg-cx-navy border border-cx-muted/30 hover:border-cx-muted/60 rounded-xl p-4 transition-all">
      {/* Poster */}
      <Link href={`/movie/${item.id}`} className="shrink-0">
        <div className="w-16 h-24 rounded-lg overflow-hidden bg-cx-muted/30">
          {item.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.poster}
              alt={item.title}
              className="w-full h-full object-cover hover:scale-110 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film size={24} className="text-cx-muted" />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <Link href={`/movie/${item.id}`}>
            <h3 className="text-white font-body font-semibold text-sm hover:text-cx-accent transition-colors">
              {item.title}
            </h3>
          </Link>
          <span className={`px-2 py-0.5 rounded border text-xs font-body font-bold tracking-wider ${qClass}`}>
            {item.quality}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="flex items-center gap-1 text-xs font-body text-white/40">
            {item.type === 'series' ? <Tv size={10} /> : <Film size={10} />}
            {item.type === 'series' ? 'Series' : 'Movie'}
          </span>
          {item.type === 'series' && item.season && item.episode && (
            <span className="text-xs font-body text-cx-ice/50">
              S{item.season}E{item.episode}
            </span>
          )}
          {item.year && (
            <span className="text-xs font-body text-white/30">{item.year}</span>
          )}
          {item.size && (
            <span className="text-xs font-body text-white/30">{item.size}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-xs text-white/30 font-body">
            <Download size={10} />
            {formatRelativeTime(item.downloadedAt)}
          </span>
          <Link
            href={`/movie/${item.id}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-cx-accent/10 hover:bg-cx-accent border border-cx-accent/20 hover:border-cx-accent rounded-lg text-cx-accent hover:text-white text-xs font-body font-semibold transition-all"
          >
            <ExternalLink size={11} />
            View
          </Link>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white/80 transition-all self-start"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function DownloadsPage() {
  const { downloads, removeDownload, clearDownloads } = useDownloadHistory()
  const [confirmClear, setConfirmClear] = useState(false)

  // Stats
  const qualityCounts = downloads.reduce<Record<string, number>>((acc, d) => {
    acc[d.quality] = (acc[d.quality] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Download size={24} className="text-cx-accent" />
              <h1 className="font-display text-4xl text-white tracking-widest">DOWNLOAD HISTORY</h1>
            </div>
            <p className="text-white/40 font-body text-sm">
              {downloads.length} download{downloads.length !== 1 ? 's' : ''} tracked
            </p>
          </div>

          {downloads.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs font-body">Clear all?</span>
                  <button
                    onClick={() => { clearDownloads(); setConfirmClear(false) }}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-xs font-body transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-lg text-xs font-body transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/50 hover:text-red-400 rounded-lg text-sm font-body transition-all"
                >
                  <Trash2 size={14} />
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quality stats strip */}
        {downloads.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {Object.entries(qualityCounts).map(([q, count]) => {
              const qClass = qualityColor[q] || 'text-cx-ice border-cx-accent/30 bg-cx-accent/10'
              return (
                <div key={q} className={`px-3 py-1.5 rounded-lg border text-xs font-body font-semibold flex items-center gap-2 ${qClass}`}>
                  {q} <span className="opacity-60">×{count}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="w-24 h-px bg-gradient-to-r from-cx-accent to-transparent mb-8" />

        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Download size={48} className="text-cx-muted mb-4" />
            <h3 className="text-white/60 font-display text-2xl tracking-widest mb-2">No Downloads Yet</h3>
            <p className="text-white/30 font-body text-sm mb-6">
              Every file you download will be tracked here with quality and timestamp.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-cx-accent/10 hover:bg-cx-accent border border-cx-accent/30 hover:border-cx-accent text-cx-accent hover:text-white rounded-lg font-body font-semibold text-sm transition-all"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map(item => (
              <DownloadCard
                key={item.downloadedAt}
                item={item}
                onRemove={() => removeDownload(item.downloadedAt)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Need to import this for type usage in component
const qualityColor: Record<string, string> = {
  '1080p': 'text-green-400 border-green-500/30 bg-green-500/10',
  '720p': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  '480p': 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  '360p': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
}
