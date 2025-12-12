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
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-white via-[#f5f9ff] to-[#e8f6ff] text-white">
      <InteractiveAvatar />
    </div>
  )
}
