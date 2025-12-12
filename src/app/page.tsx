'use client'

import { useEffect } from 'react'
import InteractiveAvatar from '@/components/InteractiveAvatar'

export default function AIPage() {
  useEffect(() => {
    // Lock screen orientation for TV display (if supported)
    if ('orientation' in screen && 'lock' in (screen.orientation as any)) {
      (screen.orientation as any).lock('portrait').catch(() => {
        // Orientation lock not supported
      })
    }
  }, [])

  return (
    <div className="h-screen bg-gradient-to-b from-white via-[#f5f9ff] to-[#e8f6ff] flex flex-col overflow-hidden">
      <header className="flex justify-center py-4 px-6 flex-none">
        <img
          src="/header_logo.svg"
          alt="Кампус Уфа"
          className="h-10 w-auto drop-shadow-sm"
        />
      </header>

      <main className="flex-1 flex justify-center items-center px-12 pb-6 overflow-hidden">
        <InteractiveAvatar />
      </main>
    </div>
  )
}
