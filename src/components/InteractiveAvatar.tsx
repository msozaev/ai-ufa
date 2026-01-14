'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  LiveAvatarSession,
  SessionEvent,
  AgentEventsEnum
} from '@heygen/liveavatar-web-sdk'
import { DEFAULT_AVATAR_ID, DEFAULT_VOICE_ID, DEFAULT_CONTEXT_ID } from '@/lib/heygen'

const CONTEXT_ID = DEFAULT_CONTEXT_ID

export default function InteractiveAvatar() {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [statusText, setStatusText] = useState('Готов к запуску')

  const session = useRef<LiveAvatarSession | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    return () => {
      endSession()
    }
  }, [])

  async function fetchAccessToken(): Promise<{ token: string; sessionId: string }> {
    try {
      const response = await fetch('/api/heygen-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: DEFAULT_AVATAR_ID,
          voiceId: DEFAULT_VOICE_ID,
          contextId: CONTEXT_ID
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get token')
      }

      const data = await response.json()
      return { token: data.sessionToken, sessionId: data.sessionId }
    } catch (error) {
      console.error('Failed to fetch access token:', error)
      throw error
    }
  }

  const setMicrophoneMuted = useCallback((shouldMute: boolean) => {
    if (!session.current) return

    const voiceChat = (session.current as any).voiceChat
    if (!voiceChat) return

    const track = voiceChat.track
    if (!track) return

    const mediaTrack = track.mediaStreamTrack || track

    if (mediaTrack && typeof mediaTrack.enabled !== 'undefined') {
      mediaTrack.enabled = !shouldMute
      setIsMuted(shouldMute)
    }
  }, [])

  const startSession = useCallback(async () => {
    if (isLoadingSession || isSessionActive) return

    setIsLoadingSession(true)
    setStatusText('Подключаемся...')

    try {
      if (!CONTEXT_ID) {
        alert('Please set the CONTEXT_ID in src/components/InteractiveAvatar.tsx first!')
        setIsLoadingSession(false)
        return
      }

      const { token } = await fetchAccessToken()

      session.current = new LiveAvatarSession(token, {
        voiceChat: false,
        apiUrl: 'https://api.liveavatar.com'
      })

      session.current.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (videoRef.current) {
          try {
            session.current?.attach(videoRef.current)
            setStatusText('В эфире')
          } catch (e) {
            console.error('Error attaching stream:', e)
            setStatusText('Ошибка подключения')
          }
        }
      })

      session.current.on(SessionEvent.SESSION_DISCONNECTED, () => {
        setStatusText('Отключено')
        endSession()
      })

      session.current.on(AgentEventsEnum.USER_SPEAK_STARTED, () => {
        setIsUserSpeaking(true)
        setStatusText('Слушаю...')
      })

      session.current.on(AgentEventsEnum.USER_SPEAK_ENDED, () => {
        setIsUserSpeaking(false)
        setStatusText('Готов')
      })

      session.current.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        setIsAvatarSpeaking(true)
        setStatusText('Говорю...')
      })

      session.current.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        setIsAvatarSpeaking(false)
        setStatusText('Готов')
      })

      session.current.on(AgentEventsEnum.USER_TRANSCRIPTION, () => {
        setMicrophoneMuted(true)
      })

      await session.current.start()
      setIsSessionActive(true)
      setStatusText('Соединение установлено')
    } catch (error: any) {
      console.error('Failed to start avatar session:', error)
      setStatusText('Ошибка подключения')
    } finally {
      setIsLoadingSession(false)
    }
  }, [isLoadingSession, isSessionActive, setMicrophoneMuted])

  const toggleMute = useCallback(() => {
    setMicrophoneMuted(!isMuted)
  }, [isMuted, setMicrophoneMuted])

  const endSession = useCallback(async () => {
    if (!session.current) {
      setStatusText('Готов к запуску')
      return
    }

    try {
      await session.current.stop()
    } catch (error) {
      console.error('Error stopping session:', error)
    } finally {
      session.current = null
      setIsSessionActive(false)
      setIsAvatarSpeaking(false)
      setIsUserSpeaking(false)
      setIsMuted(false)
      setStatusText('Готов к запуску')
    }
  }, [])

  return (
    <div className="relative h-full w-full text-white">
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover object-center bg-gradient-to-br from-white via-[#f5f9ff] to-[#e8f6ff] transition-all ${
            isSessionActive ? 'opacity-100' : 'opacity-30 blur-[1px]'
          }`}
          autoPlay
          playsInline
        />
        {!isSessionActive && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-[#f5f9ff]/90 to-[#e8f6ff]/85" />
        )}
      </div>

      <div className="relative z-10 flex h-full w-full flex-col">
        {isSessionActive && (
          <header className="flex items-center justify-between px-6 sm:px-10 pt-6">
            <img src="/ukmira_logo.svg" alt="Кампус" className="h-16 w-auto drop-shadow-lg" />
            <img src="/header_logo.svg" alt="УК МИРА" className="h-16 w-auto drop-shadow-lg" />
          </header>
        )}

        <div className="flex-1 flex items-center justify-center px-6 pb-28 sm:pb-32">
          {!isSessionActive && (
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="flex items-center gap-6">
                <img src="/ukmira_logo.svg" alt="Кампус" className="h-20 w-auto drop-shadow-lg" />
                <img src="/header_logo.svg" alt="УК Мира" className="h-20 w-auto drop-shadow-lg" />
              </div>
              <button
                onClick={startSession}
                className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#5cf4ff] via-[#3b82f6] to-[#8b5cf6] px-10 sm:px-14 py-4 sm:py-5 text-xl sm:text-2xl font-semibold shadow-[0_20px_80px_-20px_rgba(59,130,246,0.9)] transition-transform hover:-translate-y-0.5 focus:outline-none"
                disabled={isLoadingSession}
              >
                {isLoadingSession ? (
                  <>
                    <span className="h-3 w-3 rounded-full bg-white animate-ping" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    Запустить ИИ
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {isSessionActive && (isAvatarSpeaking || isUserSpeaking) && (
          <div className="absolute left-6 bottom-32 sm:bottom-40 flex items-center gap-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur px-4 py-2 shadow-lg">
            <div className="flex gap-1">
              <span
                className={`w-1 h-4 rounded-full animate-pulse ${
                  isUserSpeaking ? 'bg-emerald-300' : 'bg-indigo-200'
                }`}
              />
              <span
                className={`w-1 h-6 rounded-full animate-pulse delay-100 ${
                  isUserSpeaking ? 'bg-emerald-400' : 'bg-indigo-300'
                }`}
              />
              <span
                className={`w-1 h-4 rounded-full animate-pulse delay-200 ${
                  isUserSpeaking ? 'bg-emerald-300' : 'bg-indigo-200'
                }`}
              />
            </div>
            <span className="text-sm font-semibold">
              {isAvatarSpeaking ? 'Говорю' : isUserSpeaking ? 'Слушаю' : 'В эфире'}
            </span>
          </div>
        )}

        <div className="relative z-20 flex items-center justify-center pb-6 sm:pb-10">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 px-4">
            {isSessionActive && (
              <button
                onClick={toggleMute}
                className={`pointer-events-auto inline-flex items-center gap-3 rounded-full px-6 sm:px-7 py-3.5 text-sm sm:text-base font-semibold transition-all shadow-[0_10px_50px_-20px_rgba(99,102,241,0.6)] border ${
                  isMuted
                    ? 'bg-white/10 text-white border-white/10 hover:bg-white/15'
                    : 'bg-gradient-to-r from-[#22d3ee] via-[#2563eb] to-[#7c3aed] text-white border-white/10 hover:brightness-110'
                }`}
              >
                {isMuted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5v4m0 0L5.5 5.5m3.5 3.5L5.5 9.5M15 9a3 3 0 00-3-3m0 0a3 3 0 00-3 3v3a3 3 0 003 3m0 0a3 3 0 003-3V9zM12 18v3m-4 0h8"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3zm0 12v4m-4 0h8"
                    />
                  </svg>
                )}
                {isMuted ? 'Микрофон выключен' : 'Микрофон включен'}
              </button>
            )}

            {isSessionActive && (
              <button
                onClick={endSession}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-3 text-sm sm:text-base font-semibold bg-white/10 text-rose-100 border border-white/15 backdrop-blur hover:bg-white/15 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Завершить эфир
              </button>
            )}

            {!isSessionActive && (
              <button
                onClick={startSession}
                className="pointer-events-auto inline-flex items-center gap-3 rounded-full px-7 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-semibold bg-white/10 text-white border border-white/15 backdrop-blur hover:bg-white/15 transition-all"
                disabled={isLoadingSession}
              >
                {isLoadingSession ? 'Запуск...' : 'Запустить ИИ'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
