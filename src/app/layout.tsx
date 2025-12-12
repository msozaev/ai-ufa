import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Кампус Уфа — ИИ ассистент',
  description: 'Интерактивный голосовой ассистент кампуса Уфа',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>
        <div className="wave-background"></div>
        {children}
      </body>
    </html>
  )
}
