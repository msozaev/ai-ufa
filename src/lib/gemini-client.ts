import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_API_KEY || ''

if (!apiKey) {
  console.warn('GOOGLE_API_KEY is not configured')
}

const genAI = new GoogleGenerativeAI(apiKey)

// We'll use the gemini-1.5-pro model as the "Pro" model requested.
// If "gemini-3.0-pro" becomes available, this string can be updated.
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
