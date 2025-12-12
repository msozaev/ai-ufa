'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  TaskMode,
} from '@heygen/streaming-avatar'

const DEFAULT_AVATAR_ID = 'Katya_Chair_Sitting_public'

// Voice IDs for different languages
const VOICE_IDS = {
  ru: '37832e32d4f7475ab7a1cb0db8e5dd66', // Russian-specific voice
  default: '42d00d4aac5441279d8536cd6b52c53c' // All other languages
}

// Language codes mapping for speech recognition
const LANGUAGE_CODES: { [key: string]: string } = {
  'ru': 'ru-RU',
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'zh': 'zh-CN',
  'pt': 'pt-BR',
  'hi': 'hi-IN',
  'ar': 'ar-SA',
  'de': 'de-DE',
  'ja': 'ja-JP',
  'hy': 'hy-AM',
  'kk': 'kk-KZ',
  'uz': 'uz-UZ',
  'it': 'it-IT'
}

// Language detection patterns
const LANGUAGE_PATTERNS: { [key: string]: RegExp } = {
  'ru': /[а-яА-ЯёЁ]/,
  'zh': /[\u4e00-\u9fff\u3400-\u4dbf]/,
  'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
  'ar': /[\u0600-\u06ff\u0750-\u077f]/,
  'hi': /[\u0900-\u097f]/,
  'hy': /[\u0530-\u058f]/,
  'en': /^[a-zA-Z\s\d\p{P}]+$/u
}

// Welcome messages in different languages
const WELCOME_MESSAGES: { [key: string]: string } = {
  'ru': 'Здравствуйте! Я ваш виртуальный ассистент кампуса Уфа. Чем могу вам помочь?',
  'en': 'Hello! I am your virtual assistant for Ufa Campus. How can I help you?',
  'es': '¡Hola! Soy su asistente virtual para el campus de Ufa. ¿Cómo puedo ayudarle?',
  'fr': 'Bonjour! Je suis votre assistant virtuel pour le campus de Ufa. Comment puis-je vous aider?',
  'zh': '你好！我是Ufa校园的虚拟助手。我能为您做什么？',
  'pt': 'Olá! Eu sou seu assistente virtual para o campus de Ufa. Como posso ajudá-lo?',
  'hi': 'नमस्ते! मैं Ufa कैंपस के लिए आपका वर्चुअल सहायक हूं। मैं आपकी कैसे मदद कर सकता हूं?',
  'ar': 'مرحبا! أنا مساعدك الافتراضي لحرم Ufa. كيف يمكنني مساعدتك؟',
  'de': 'Hallo! Ich bin Ihr virtueller Assistent für den Ufa Campus. Wie kann ich Ihnen helfen?',
  'ja': 'こんにちは！私はUfaキャンパスのバーチャルアシスタントです。どのようにお手伝いできますか？',
  'hy': 'Բարև Ձեզ! Ես Ձեր վիրտուալ օգնականն եմ Ufa ճամբարում։ Ինչպե՞ս կարող եմ օգնել Ձեզ:',
  'kk': 'Сәлеметсіз бе! Мен Ufa кампусының виртуалды көмекшісімін. Сізге қалай көмектесе аламын?',
  'uz': 'Salom! Men Ufa kampusining virtual yordamchisiman. Sizga qanday yordam bera olaman?',
  'it': 'Ciao! Sono il tuo assistente virtuale per il campus di Ufa. Come posso aiutarti?'
}

// Function to detect language from text
function detectLanguage(text: string): string {
  // Check for specific language patterns
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(text)) {
      return lang
    }
  }

  // Check for common words/phrases in different languages
  const lowerText = text.toLowerCase()

  // Spanish detection
  if (/\b(hola|gracias|por favor|buenos|buenas|señor|señora)\b/.test(lowerText)) return 'es'

  // French detection
  if (/\b(bonjour|merci|s\'il vous plaît|monsieur|madame|comment|pourquoi)\b/.test(lowerText)) return 'fr'

  // Portuguese detection
  if (/\b(olá|obrigado|por favor|senhor|senhora|como|porque)\b/.test(lowerText)) return 'pt'

  // German detection
  if (/\b(hallo|danke|bitte|herr|frau|wie|warum|ich|sie|das|der|die)\b/.test(lowerText)) return 'de'

  // Italian detection
  if (/\b(ciao|grazie|prego|signore|signora|come|perché|sono|sei)\b/.test(lowerText)) return 'it'

  // Kazakh detection (with Cyrillic)
  if (/\b(сәлем|рахмет|қалайсыз|қандай)\b/.test(lowerText)) return 'kk'

  // Uzbek detection (Latin script)
  if (/\b(salom|rahmat|iltimos|janob|xonim|qanday|nima)\b/.test(lowerText)) return 'uz'

  // Default to Russian if Cyrillic is detected but not other languages
  if (/[а-яА-ЯёЁ]/.test(text)) return 'ru'

  // Default to English for Latin script
  if (/[a-zA-Z]/.test(text)) return 'en'

  // Final fallback to Russian
  return 'ru'
}

export default function InteractiveAvatar() {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const volume = 1.0
  const [isListening, setIsListening] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('ru') // Track current conversation language

  const avatar = useRef<StreamingAvatar | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clear chat history on component mount for fresh start
    setChatHistory([])

    // Cleanup on unmount
    return () => {
      endSession()
    }
  }, [])

  async function fetchAccessToken(): Promise<string> {
    try {
      const response = await fetch('/api/heygen-token', {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Token API error:', errorData)
        throw new Error(errorData.error || 'Failed to get token')
      }
      const data = await response.json()
      console.log('Token received:', data.token ? 'Yes' : 'No')
      return data.token || ''
    } catch (error) {
      console.error('Failed to fetch access token:', error)
      return ''
    }
  }

  const startVoiceChat = useCallback(async () => {
    if (!avatar.current) return

    // Stop any existing recognition
    if ((window as any).currentRecognition) {
      try {
        (window as any).currentRecognition.stop()
        ;(window as any).currentRecognition = null
      } catch (e) {
        console.log('Error stopping existing recognition:', e)
      }
    }

    // Don't start if avatar is speaking
    if ((window as any).isAvatarCurrentlySpeaking) {
      console.log('Avatar is speaking, not starting voice chat')
      return
    }

    try {
      console.log('Starting custom voice input...')

      // Use browser's native speech recognition instead of HeyGen's
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        alert('Speech recognition not supported in this browser')
        return
      }

      const recognition = new SpeechRecognition()

      // Set language based on current conversation language
      recognition.lang = LANGUAGE_CODES[currentLanguage] || 'ru-RU'
      console.log('Setting speech recognition language to:', recognition.lang)

      recognition.continuous = true // Keep listening continuously
      recognition.interimResults = true // Get interim results for better language detection
      recognition.maxAlternatives = 1

      recognition.onresult = async (event: any) => {
        // Update last activity time
        ;(window as any).lastRecognitionActivity = Date.now()

        // Double check avatar is not speaking
        if ((window as any).isAvatarCurrentlySpeaking) {
          console.log('Ignoring speech - avatar is speaking')
          return
        }

        const last = event.results.length - 1
        const result = event.results[last]

        // Only process final results
        if (!result.isFinal) {
          return
        }

        const text = result[0].transcript

        console.log('Speech recognized:', text)

        // Detect language from the recognized text
        const detectedLang = detectLanguage(text)
        console.log('Detected language:', detectedLang)

        // If language changed, update it for next recognition
        if (detectedLang !== currentLanguage) {
          console.log('Language switched from', currentLanguage, 'to', detectedLang)
          setCurrentLanguage(detectedLang)

          // Update recognition language for next time
          ;(window as any).nextRecognitionLanguage = detectedLang
        }

        setIsListening(false)

        // Stop recognition before processing
        try {
          recognition.stop()
          ;(window as any).currentRecognition = null
        } catch (e) {
          // Already stopped
        }

        // Process with Gemini, passing the detected language
        await processUserMessage(text, detectedLang)
      }

      recognition.onstart = () => {
        setIsListening(true)
        ;(window as any).lastRecognitionActivity = Date.now()
        console.log('Listening started')
      }

      recognition.onend = () => {
        setIsListening(false)
        console.log('Listening ended')

        // Auto-restart if mic is still enabled and avatar is not speaking
        if ((window as any).micEnabled && !(window as any).isAvatarCurrentlySpeaking) {
          setTimeout(() => {
            console.log('Auto-restarting speech recognition...')
            startVoiceChat()
          }, 500)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)

        // Only retry on specific errors, not on 'no-speech' or 'aborted'
        const shouldRetry = event.error !== 'no-speech' &&
                           event.error !== 'aborted' &&
                           event.error !== 'not-allowed'

        if (shouldRetry && (window as any).micEnabled && !(window as any).isAvatarCurrentlySpeaking) {
          setTimeout(() => {
            console.log('Restarting after error:', event.error)
            startVoiceChat()
          }, 1000)
        } else if (event.error === 'no-speech') {
          // For no-speech, just update activity time but don't restart immediately
          ;(window as any).lastRecognitionActivity = Date.now()
        }
      }

      recognition.start()
      ;(window as any).currentRecognition = recognition

      // Check if we should use a different language from last detection
      if ((window as any).nextRecognitionLanguage) {
        setCurrentLanguage((window as any).nextRecognitionLanguage)
        delete (window as any).nextRecognitionLanguage
      }

      setIsMicEnabled(true)
      ;(window as any).micEnabled = true // Also set global flag
      console.log('Custom voice input started')

      // Set up a health check (not a restart) every 60 seconds
      if ((window as any).recognitionHealthCheck) {
        clearInterval((window as any).recognitionHealthCheck)
      }

      ;(window as any).lastRecognitionActivity = Date.now()

      ;(window as any).recognitionHealthCheck = setInterval(() => {
        if ((window as any).micEnabled && !(window as any).isAvatarCurrentlySpeaking) {
          const timeSinceLastActivity = Date.now() - ((window as any).lastRecognitionActivity || 0)
          console.log('Health check - time since last activity:', timeSinceLastActivity)

          // Only restart if there's been no activity for over 60 seconds
          if (timeSinceLastActivity > 60000) {
            console.log('No activity for 60s, restarting recognition')
            const currentRec = (window as any).currentRecognition
            if (currentRec) {
              try {
                currentRec.stop()
              } catch (e) {
                console.log('Error stopping stale recognition:', e)
              }
            }
            // Restart after a short delay
            setTimeout(() => {
              if ((window as any).micEnabled && !(window as any).isAvatarCurrentlySpeaking) {
                startVoiceChat()
              }
            }, 500)
          }
        }
      }, 30000) // Check every 30 seconds, but only restart if needed
    } catch (error) {
      console.error('Failed to start voice input:', error)
      alert('Failed to start voice input. Please check microphone permissions.')
    }
  }, [currentLanguage])

  const stopVoiceChat = useCallback(async () => {
    if (!isMicEnabled) return

    try {
      console.log('Stopping custom voice input...')

      const recognition = (window as any).currentRecognition
      if (recognition) {
        recognition.stop()
        ;(window as any).currentRecognition = null
      }

      // Clear the health check interval
      if ((window as any).recognitionHealthCheck) {
        clearInterval((window as any).recognitionHealthCheck)
        ;(window as any).recognitionHealthCheck = null
      }

      setIsMicEnabled(false)
      ;(window as any).micEnabled = false // Also clear global flag
      setIsListening(false)
      console.log('Custom voice input stopped')
    } catch (error) {
      console.error('Failed to stop voice input:', error)
    }
  }, [isMicEnabled])

  const processUserMessage = useCallback(async (userText: string, detectedLanguage?: string) => {
    if (!avatar.current || !userText) return

    console.log('Processing user message with GPT-4o:', userText)

    // Use detected language or detect it
    const language = detectedLanguage || detectLanguage(userText)
    console.log('Using language for response:', language)

    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', content: userText }])

    // Process with Gemini
    try {
      setIsProcessing(true)

      console.log('Sending to Gemini API with language:', language)
      const response = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          language: language,
          // Don't send chat history - each interaction should be stateless
          chatHistory: [],
        }),
      })

      const data = await response.json()
      const aiResponse = data.response
      console.log('Gemini response received:', aiResponse)

      // Add AI response to history
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }])

      // Select voice ID based on detected language for this response
      const responseVoiceId = language === 'ru' ? VOICE_IDS.ru : VOICE_IDS.default

      // Make avatar speak ONLY our Gemini response
      // Note: Voice switching during session may not be supported by HeyGen API
      // The voice will be set at session initialization
      await avatar.current.speak({
        text: aiResponse,
        taskType: TaskType.REPEAT, // Just repeat what we tell it
        taskMode: TaskMode.SYNC,
        // Attempt to set voice if API supports it (may be ignored)
        voice: {
          voiceId: responseVoiceId,
          rate: 1.0
        }
      } as any)
    } catch (error) {
      console.error('Error processing with Gemini:', error)
      const errorMessage = 'Извините, произошла ошибка при обработке вашего сообщения.'
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMessage }])

      if (avatar.current) {
        // Use Russian voice for Russian error message
        await avatar.current.speak({
          text: errorMessage,
          taskType: TaskType.REPEAT,
          taskMode: TaskMode.SYNC,
          // Attempt to set voice if API supports it
          voice: {
            voiceId: VOICE_IDS.ru,
            rate: 1.0
          }
        } as any)
      }
    } finally {
      setIsProcessing(false)
    }
  }, [chatHistory])

  // Make processUserMessage available globally
  useEffect(() => {
    ;(window as any).processUserMessage = processUserMessage
  }, [processUserMessage])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [chatHistory])

  const startSession = useCallback(async () => {
    if (isLoadingSession || isSessionActive) return

    setIsLoadingSession(true)

    // Clear chat history for new session
    setChatHistory([])

    try {
      const token = await fetchAccessToken()
      if (!token) throw new Error('Failed to get access token')

      // Initialize StreamingAvatar
      console.log('Initializing StreamingAvatar with token...')
      avatar.current = new StreamingAvatar({ token })

      // Set up event listeners
      avatar.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('Avatar started talking')
        setIsAvatarSpeaking(true)
        ;(window as any).isAvatarCurrentlySpeaking = true

        // Stop listening when avatar starts talking
        const recognition = (window as any).currentRecognition
        if (recognition) {
          try {
            recognition.stop()
            ;(window as any).currentRecognition = null
            console.log('Stopped listening - avatar is speaking')
          } catch (e) {
            console.log('Could not stop recognition:', e)
          }
        }
      })

      avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('Avatar stopped talking')
        setIsAvatarSpeaking(false)
        ;(window as any).isAvatarCurrentlySpeaking = false

        // Wait a bit then restart listening
        setTimeout(async () => {
          const micEnabled = (window as any).micEnabled
          console.log('Checking to restart voice chat. Mic enabled:', micEnabled, 'Avatar speaking:', (window as any).isAvatarCurrentlySpeaking)

          if (micEnabled && !(window as any).isAvatarCurrentlySpeaking) {
            console.log('Restarting voice chat after avatar stopped')

            // Use startVoiceChat to restart with all the proper error handling
            console.log('Calling startVoiceChat to restart listening')
            startVoiceChat()
          } else {
            console.log('Not restarting voice chat - conditions not met')
          }
        }, 700) // 0.7 second delay to ensure avatar audio is completely done
      })

      avatar.current.on(StreamingEvents.STREAM_READY, (event: any) => {
        console.log('Stream ready event received:', event)
        const stream = avatar.current?.mediaStream
        if (videoRef.current && stream) {
          console.log('Attaching stream to video element')
          videoRef.current.srcObject = stream
          videoRef.current.muted = false // Unmute to hear avatar
          videoRef.current.volume = volume // Set volume from state
          videoRef.current.play().catch((e) => {
            console.error('Error playing video:', e)
            // If autoplay fails, we might need user interaction
            if (e.name === 'NotAllowedError') {
              console.log('Autoplay blocked, will play on user interaction')
            }
          })
          mediaStream.current = stream
        }
      })

      avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Stream disconnected')
        endSession()
      })

      // We don't need these events since we're using custom speech recognition

      // Remove HeyGen voice event handlers since we're not using their voice chat

      // Start avatar session with configured HeyGen avatar
      console.log('Starting avatar session with:', DEFAULT_AVATAR_ID)

      try {
        // Select voice ID based on current language
        const voiceId = currentLanguage === 'ru' ? VOICE_IDS.ru : VOICE_IDS.default
        console.log('Using voice ID for language', currentLanguage, ':', voiceId)

        const sessionInfo = await avatar.current.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: DEFAULT_AVATAR_ID,
          voice: {
            voiceId: voiceId,
            rate: 1.0, // Normal speed
          },
          language: currentLanguage,
          // DISABLE voice chat - we'll handle microphone separately
          voiceChatTransport: undefined,
          // No STT settings since we're not using HeyGen's voice chat
          sttSettings: undefined,
          // No knowledge base - we use GPT-5
          knowledgeBase: undefined,
        })
        console.log('Avatar session created:', sessionInfo)

        // Wait a moment for the stream to be ready
        setTimeout(() => {
          const stream = avatar.current?.mediaStream
          if (stream && videoRef.current) {
            console.log('Setting video stream after delay')
            videoRef.current.srcObject = stream
            videoRef.current.muted = false // Ensure audio is not muted
            videoRef.current.volume = volume // Set volume from state
            videoRef.current.play().catch((e) => {
              console.error('Error playing video:', e)
            })
            mediaStream.current = stream
          } else {
            console.log('Stream not ready yet, waiting for STREAM_READY event')
          }
        }, 1000)

        setIsSessionActive(true)

        // Send a welcome message and start microphone
        setTimeout(async () => {
          try {
            console.log('Sending welcome message...')
            ;(window as any).isAvatarCurrentlySpeaking = true // Mark as speaking before welcome

            // Set mic as enabled so it will auto-start after welcome
            setIsMicEnabled(true)
            ;(window as any).micEnabled = true

            // Use welcome message in current language
            const welcomeMessage = WELCOME_MESSAGES[currentLanguage] || WELCOME_MESSAGES['ru']
            const welcomeVoiceId = currentLanguage === 'ru' ? VOICE_IDS.ru : VOICE_IDS.default

            await avatar.current?.speak({
              text: welcomeMessage,
              taskType: TaskType.REPEAT,
              taskMode: TaskMode.SYNC,
              // Use appropriate voice for the language
              voice: {
                voiceId: welcomeVoiceId,
                rate: 1.0
              }
            } as any)
            console.log('Welcome message sent')

            // Voice chat will auto-start when avatar stops talking via the event handler
          } catch (e) {
            console.error('Error sending welcome message:', e)
            ;(window as any).isAvatarCurrentlySpeaking = false

            // If welcome message fails, still try to start mic
            setTimeout(() => {
              startVoiceChat()
            }, 1000)
          }
        }, 2000)
      } catch (sessionError) {
        console.error('Error creating avatar session:', sessionError)
        throw sessionError
      }
    } catch (error: any) {
      console.error('Failed to start avatar session:', error)
      alert(`Error starting avatar: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoadingSession(false)
    }
  }, [isLoadingSession, isSessionActive, startVoiceChat, isMicEnabled])

  const endSession = useCallback(async () => {
    if (!avatar.current) return

    try {
      await avatar.current.stopAvatar()

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop())
        mediaStream.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      avatar.current = null
      setIsSessionActive(false)
      setIsAvatarSpeaking(false)
      setIsMicEnabled(false)
      setIsListening(false)

      // Clear chat history when ending session
      setChatHistory([])
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }, [])



  return (
    <div className="w-full max-w-[1320px] flex flex-col items-center gap-6 md:gap-8 h-full min-h-0 mx-auto px-4">
      {/* Primary avatar viewport */}
      <div className="relative w-full flex-none aspect-[16/9] max-h-[82vh] md:max-w-[1080px] rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl">
        <div className="absolute inset-0">
        {isSessionActive ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover object-top bg-slate-900"
              autoPlay
              playsInline
            />
            {(isAvatarSpeaking || isListening || isProcessing) && (
              <div
                className={`absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg ${
                  isProcessing
                    ? 'bg-[#32bff0] text-white'
                    : isListening
                    ? 'bg-rose-500 text-white'
                    : 'bg-white text-slate-700'
                }`}
              >
                <div className="flex gap-1">
                  <div className={`w-1 h-4 animate-pulse rounded-full ${
                    isProcessing ? 'bg-white' : isListening ? 'bg-white' : 'bg-slate-600'
                  }`}></div>
                  <div className={`w-1 h-4 animate-pulse rounded-full ${
                    isProcessing ? 'bg-white' : isListening ? 'bg-white' : 'bg-slate-600'
                  }`} style={{ animationDelay: '0.1s' }}></div>
                  <div className={`w-1 h-4 animate-pulse rounded-full ${
                    isProcessing ? 'bg-white' : isListening ? 'bg-white' : 'bg-slate-600'
                  }`} style={{ animationDelay: '0.2s' }}></div>
                </div>
                {isProcessing ? 'ИИ думает...' : isAvatarSpeaking ? 'Говорю...' : 'Слушаю...'}
              </div>
            )}

          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-white via-[#f0f6ff] to-[#e3f2ff]">
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

      {/* Chat history - compact for vertical display */}
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

      {/* End session button */}
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
