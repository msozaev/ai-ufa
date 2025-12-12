'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  LiveAvatarSession, 
  SessionEvent, 
  AgentEventsEnum 
} from '@heygen/liveavatar-web-sdk'

const CONTEXT_ID = '96a7ec9a-f898-4c0a-b80e-04483fa8335d' 
const DEFAULT_AVATAR_ID = '073b60a9-89a8-45aa-8902-c358f64d2852' 
const DEFAULT_VOICE_ID = '864a26b8-bfba-4435-9cc5-1dd593de5ca7' 

export default function InteractiveAvatar() {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  
  const session = useRef<LiveAvatarSession | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      endSession()
    }
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [chatHistory])

  async function fetchAccessToken(): Promise<{ token: string, sessionId: string }> {
    try {
      const response = await fetch('/api/heygen-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarId: DEFAULT_AVATAR_ID,
          voiceId: DEFAULT_VOICE_ID,
          contextId: CONTEXT_ID
        }),
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

  const startSession = useCallback(async () => {
    if (isLoadingSession || isSessionActive) return

    setIsLoadingSession(true)
    setChatHistory([])

    try {
      if (!CONTEXT_ID) {
        alert('Please set the CONTEXT_ID in src/components/InteractiveAvatar.tsx first!')
        setIsLoadingSession(false)
        return
      }

      const { token } = await fetchAccessToken()
      
      session.current = new LiveAvatarSession(token, {
        voiceChat: true,
        apiUrl: 'https://api.liveavatar.com'
      })

      // Session Events
      session.current.on(SessionEvent.SESSION_STREAM_READY, () => {
        console.log('Stream ready event received');
        if (videoRef.current) {
          console.log('Attaching stream to video element', videoRef.current);
          try {
            session.current?.attach(videoRef.current);
            console.log('Stream attached successfully');
          } catch (e) {
            console.error('Error attaching stream:', e);
          }
        } else {
          console.error('Video ref is null when stream is ready');
        }
      })

      session.current.on(SessionEvent.SESSION_DISCONNECTED, () => {
        console.log('Session disconnected')
        endSession()
      })

      // Agent/Interaction Events
      session.current.on(AgentEventsEnum.USER_SPEAK_STARTED, () => {
        setIsUserSpeaking(true)
      })

      session.current.on(AgentEventsEnum.USER_SPEAK_ENDED, () => {
        setIsUserSpeaking(false)
      })

      session.current.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        setIsAvatarSpeaking(true)
      })

      session.current.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        setIsAvatarSpeaking(false)
      })

      session.current.on(AgentEventsEnum.USER_TRANSCRIPTION, (event) => {
        setChatHistory(prev => [...prev, { role: 'user', content: event.text }])
      })

      session.current.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (event) => {
        setChatHistory(prev => [...prev, { role: 'assistant', content: event.text }])
      })

      await session.current.start()
      setIsSessionActive(true)

    } catch (error: any) {
      console.error('Failed to start avatar session:', error)
      // alert(`Error starting avatar: ${error.message || 'Unknown error'}`) // Commented out for debugging
    } finally {
      setIsLoadingSession(false)
    }
  }, [isLoadingSession, isSessionActive])

  const endSession = useCallback(async () => {
    if (!session.current) return

    try {
      await session.current.stop()
    } catch (error) {
      console.error('Error stopping session:', error)
    } finally {
      session.current = null
      setIsSessionActive(false)
      setIsAvatarSpeaking(false)
      setIsUserSpeaking(false)
    }
  }, [])

  return (
    <div className="w-full max-w-[1320px] flex flex-col items-center gap-6 md:gap-8 h-full min-h-0 mx-auto px-4">
      <div className="relative w-full flex-none aspect-[16/9] max-h-[82vh] md:max-w-[1080px] rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover object-top bg-slate-900 ${!isSessionActive ? 'hidden' : ''}`}
            autoPlay
            playsInline
          />
          
          {/* Status indicators */}
          {isSessionActive && (isAvatarSpeaking || isUserSpeaking) && (
            <div
              className={`absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg ${
                isUserSpeaking
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-slate-700'
              }`}
            >
              <div className="flex gap-1">
                <div className={`w-1 h-4 animate-pulse rounded-full ${
                  isUserSpeaking ? 'bg-white' : 'bg-slate-600'
                }`}></div>
                <div className={`w-1 h-4 animate-pulse rounded-full ${
                  isUserSpeaking ? 'bg-white' : 'bg-slate-600'
                }`} style={{ animationDelay: '0.1s' }}></div>
                <div className={`w-1 h-4 animate-pulse rounded-full ${
                  isUserSpeaking ? 'bg-white' : 'bg-slate-600'
                }`} style={{ animationDelay: '0.2s' }}></div>
              </div>
              {isAvatarSpeaking ? 'Говорю...' : isUserSpeaking ? 'Слушаю...' : 'Готов к общению'}
            </div>
          )}

          {/* Start Screen overlay */}
          {!isSessionActive && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-white via-[#f0f6ff] to-[#e3f2ff]">
              <div className="text-center text-slate-600 px-6">
                {!isLoadingSession ? (
                  <button
                    onClick={startSession}
                    className="bg-[#32bff0] text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg hover:bg-[#2aa6d1] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#32bff0]/30"
                  >
                    Запустить ИИ Кампуса
                  </button>
                ) : (
                  <div className="text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#32bff0] mx-auto mb-2"></div>
                    Подключение...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isSessionActive && chatHistory.length > 0 && (
        <div
          ref={chatContainerRef}
          className="w-full flex-none h-[150px] md:max-w-[1080px] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
        >
          <div className="space-y-2">
            {chatHistory.slice(-3).map((msg, idx) => (
              <div
                key={idx}
                className={`text-sm ${msg.role === 'user' ? 'text-slate-700' : 'text-slate-500'}`}
              >
                <span className="font-semibold">
                  {msg.role === 'user' ? 'Вы: ' : 'AI: '}
                </span>
                {msg.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {isSessionActive && (
        <div className="w-full md:max-w-[1080px] flex justify-center pb-2 md:pb-4 -translate-y-2">
          <button
            onClick={endSession}
            className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Завершить разговор
          </button>
        </div>
      )}
    </div>
  )
}
