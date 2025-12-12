import { NextRequest, NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini-client'
import knowledgeBase from '@/data/ufa-knowledge-base.json'

const SUPPORTED_LANGUAGES = ['ru', 'en'] as const

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const DEFAULT_LANGUAGE: SupportedLanguage = 'ru'

const SYSTEM_PROMPTS: Record<SupportedLanguage, string> = {
  ru: `Вы — виртуальный ассистент Межвузовского студенческого кампуса Евразийского научно-образовательного центра мирового уровня в Уфе. вы помогаете студентам, сотрудникам, партнёрам и гостям кампуса.

БАЗОВЫЕ ПРАВИЛА:
- Отвечайте на том языке, на котором к вам обратились.
- Общайтесь уважительно на «вы», будьте тёплым и деловым гидом.
- Не используйте нумерованные списки; если нужно перечислить факты, делайте это естественным текстом.
- Ссылайтесь на факты из базы знаний: инфраструктура, лаборатории, партнёры, мероприятия, контакты.
- Если информации нет в базе, предложите обратиться на сайт campusufa.ru или к ответственным сотрудникам.
- Подчёркивайте, что кампус интегрирует образование, науку и индустрию, а ключевые объекты — IQ-парк, Геномный центр и главное жилое здание.
- Если спрашивают, кто вас создал, отвечайте: «Меня создала команда программистов УК МИРА для кампуса Уфа».
- ВСЕГДА обращайтесь к пользователям на "вы" (используйте "вы", "вам", "ваш", "вас")
- Говорите естественно
- НЕ ИСПОЛЬЗУЙТЕ нумерованные списки (1,2,3) в ответах
- Не начинайте сразу перечислять варианты - сначала дайте краткий контекст
- Будьте кратким - обычно достаточно 2-3 предложений
- Если нужно перечислить несколько мест, делайте это через запятую или в естественной форме
- Используйте вежливые фразы: "если вам интересно", "возможно, вам подойдёт", "рекомендую обратить внимание"`,
  en: `You are the virtual assistant for the Inter-University Campus of the Eurasian Research and Education Center of World Level in Ufa (Campus Ufa). You were created by the UK MIRA engineering team to guide students, staff, partners, and guests.

COMMUNICATION GUIDELINES:
- Reply in the same language used by the visitor.
- Be respectful, concise, and sound like a knowledgeable campus representative.
- Avoid numbered lists; weave key facts into natural sentences.
- Ground every answer in the knowledge base: mission, infrastructure, laboratories, partners, events, contacts.
- If information is missing, suggest visiting campusufa.ru or reaching out to the listed contacts.
- Highlight that the campus connects education, science, and industry with anchor facilities such as the IQ Park, Genome Center, and the main residential complex.
- If someone asks who created you, say: "I was created by the UK MIRA programming team for Campus Ufa."`
}

const UNAVAILABLE_MESSAGES: Record<SupportedLanguage, string> = {
  ru: 'Извините, AI-ассистент временно недоступен. Пожалуйста, обратитесь на ресепшн или на campusufa.ru.',
  en: 'Sorry, the AI assistant is temporarily unavailable. Please contact reception or visit campusufa.ru.'
}

const FALLBACK_MESSAGES: Record<SupportedLanguage, string> = {
  ru: 'Извините, я не смог обработать ваш запрос. Попробуйте сформулировать вопрос иначе или свяжитесь с кампусом напрямую.',
  en: 'Sorry, I could not process your request. Please rephrase it or reach out to the campus team directly.'
}

const ERROR_MESSAGES: Record<SupportedLanguage, string> = {
  ru: 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже или свяжитесь с кампусом.',
  en: 'Sorry, an error occurred while processing your request. Please try again later or contact the campus team.'
}

function resolveLanguage(language: unknown): SupportedLanguage {
  if (typeof language === 'string' && SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
    return language as SupportedLanguage
  }
  return DEFAULT_LANGUAGE
}

function getSystemPrompt(language: SupportedLanguage): string {
  return SYSTEM_PROMPTS[language]
}

export async function POST(request: NextRequest) {
  let language: SupportedLanguage = DEFAULT_LANGUAGE

  try {
    const body = await request.json()
    const { message, language: requestedLanguage, chatHistory = [] } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    language = resolveLanguage(requestedLanguage)

    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is missing')
      return NextResponse.json({ response: UNAVAILABLE_MESSAGES[language] })
    }

    const systemPrompt = getSystemPrompt(language)

    const knowledgeBaseContext = `

Актуальная база знаний о Межвузовском студенческом кампусе Евразийского НОЦ (Кампус Уфа):
${JSON.stringify(knowledgeBase, null, 2)}

Используйте сведения выше, чтобы давать точные и полезные ответы.`

    // Convert chat history to Gemini format
    const history = chatHistory.slice(-10).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    try {
      // Start a chat session
      const chat = geminiModel.startChat({
        history: history,
        systemInstruction: systemPrompt + knowledgeBaseContext,
      })

      const result = await chat.sendMessage(message)
      const response = result.response.text() || FALLBACK_MESSAGES[language]

      return NextResponse.json({ response })
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError)
      return NextResponse.json({ response: FALLBACK_MESSAGES[language] })
    }
  } catch (error) {
    console.error('Error in Gemini chat route:', error)
    const message = ERROR_MESSAGES[language] || ERROR_MESSAGES[DEFAULT_LANGUAGE]
    return NextResponse.json({ response: message }, { status: 500 })
  }
}