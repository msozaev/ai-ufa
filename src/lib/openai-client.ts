import axios from 'axios'

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionRequest {
  model: string
  messages: ChatCompletionMessage[]
  temperature?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
}

class OpenAIClient {
  private baseURL: string
  private apiKey: string

  constructor() {
    // Use proxy URL if available, otherwise use direct OpenAI API
    if (process.env.OPENAI_PROXY_URL) {
      // Remove trailing slash if present
      const proxyUrl = process.env.OPENAI_PROXY_URL.replace(/\/$/, '')
      this.baseURL = `${proxyUrl}/api/openai`
    } else {
      this.baseURL = 'https://api.openai.com/v1'
    }

    this.apiKey = process.env.OPENAI_API_KEY || ''

    if (!this.apiKey) {
      console.warn('OpenAI API key is not configured')
    }
  }

  async createChatCompletion(request: ChatCompletionRequest) {
    try {
      // Construct URL ensuring no double slashes
      const url = process.env.OPENAI_PROXY_URL
        ? `${this.baseURL}/chat/completions`.replace(/\/+/g, '/').replace('https:/', 'https://')
        : `${this.baseURL}/chat/completions`

      console.log('Making request to:', url)

      const response = await axios.post(
        url,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            // Use x-api-key header for proxy, Authorization for direct API
            ...(process.env.OPENAI_PROXY_URL
              ? { 'x-api-key': this.apiKey }
              : { 'Authorization': `Bearer ${this.apiKey}` }
            )
          }
        }
      )

      return response.data
    } catch (error: any) {
      console.error('OpenAI API error:', error.response?.data || error.message)
      throw error
    }
  }
}

// Export a singleton instance
export const openaiClient = new OpenAIClient()

// Export types for use in other files
export type { ChatCompletionMessage, ChatCompletionRequest }