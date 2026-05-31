import { Suspense } from 'react'
import SearchClient from './SearchClient'

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cx-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cx-accent mx-auto mb-4"></div>
          <p className="text-white/60 font-body">Loading search...</p>
        </div>
      </div>
    }>
      <SearchClient />
    </Suspense>
  )
}