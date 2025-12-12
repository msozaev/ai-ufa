
import { NextResponse } from 'next/server';
import { DEFAULT_AVATAR_ID, DEFAULT_VOICE_ID, DEFAULT_CONTEXT_ID } from '@/lib/heygen';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      avatarId = DEFAULT_AVATAR_ID,
      voiceId = DEFAULT_VOICE_ID,
      contextId = DEFAULT_CONTEXT_ID,
    } = body;

    const apiKey = process.env.LIVEAVATAR_API_KEY;

    if (!apiKey) {
      console.error('API key missing from environment variables');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log('API Key loaded:', apiKey.substring(0, 4) + '...');

    const payload = {
      mode: 'FULL',
      avatar_id: avatarId,
      voice_id: voiceId,
      knowledge_id: contextId,
      avatar_persona: {
        voice_id: voiceId,
        context_id: contextId,
        language: 'ru',
      },
    };

    console.log('Sending payload to LiveAvatar:', JSON.stringify(payload, null, 2));


    const response = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiveAvatar API Error Status:', response.status);
      console.error('LiveAvatar API Error Body:', errorText);
      return NextResponse.json({ error: `LiveAvatar API error: ${response.status} ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      sessionId: data.data.session_id,
      sessionToken: data.data.session_token,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
