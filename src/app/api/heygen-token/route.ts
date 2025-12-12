import { NextResponse } from 'next/server'

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY || ''

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      console.error('HeyGen API key is missing from environment variables')
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      )
    }

    // Get access token from HeyGen
    const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'x-api-key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('HeyGen API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get HeyGen token' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.data?.token) {
      console.error('Invalid response from HeyGen API:', data)
      return NextResponse.json(
        { error: 'Invalid response from HeyGen' },
        { status: 500 }
      )
    }

    return NextResponse.json({ token: data.data.token })
  } catch (error) {
    console.error('Error fetching HeyGen access token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}