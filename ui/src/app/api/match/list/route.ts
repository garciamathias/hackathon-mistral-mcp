import { NextResponse } from 'next/server';
import { getSessionHeaders } from '@/lib/session';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mcp-hackthon-production.up.railway.app';

export async function GET(request: Request) {
  try {
    // First try to get headers from the request (client-side)
    let playerId = request.headers.get('x-player-id');
    let playerName = request.headers.get('x-player-name');

    // If not in headers, fall back to server-side cookies
    if (!playerId || !playerName) {
      const sessionHeaders = await getSessionHeaders();
      playerId = sessionHeaders['x-player-id'];
      playerName = sessionHeaders['x-player-name'];
    }

    const headers = {
      'x-player-id': playerId,
      'x-player-name': playerName,
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${BACKEND_URL}/api/match`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error listing matches:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list matches'
        },
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}