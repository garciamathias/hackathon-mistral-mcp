import { NextRequest, NextResponse } from 'next/server';
import { getSessionHeaders } from '@/lib/session';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mcp-hackthon-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    console.log('[Frontend API /join] Request to join match:', {
      matchId: body.matchId,
      playerId: headers['x-player-id'],
      playerName: headers['x-player-name']
    });

    const response = await fetch(`${BACKEND_URL}/api/match/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Frontend API /join] Backend error:', {
        status: response.status,
        error: data.error,
        matchId: body.matchId
      });
      return NextResponse.json(data, { status: response.status });
    }

    // Fix WebSocket URL for Railway deployment
    if (data.data && data.data.wsUrl) {
      const originalUrl = data.data.wsUrl;

      // Parse the URL to extract query parameters
      let wsUrl = originalUrl;

      // Extract query parameters if they exist
      const urlParts = wsUrl.split('?');
      const queryString = urlParts[1] || '';

      // Build the correct WebSocket URL for Railway
      if (queryString) {
        wsUrl = `wss://mcp-hackthon-production.up.railway.app/ws?${queryString}`;
      } else {
        wsUrl = `wss://mcp-hackthon-production.up.railway.app/ws`;
      }

      data.data.wsUrl = wsUrl;
    }

    console.log('[Frontend API /join] Successfully joined match:', {
      matchId: body.matchId,
      team: data.data?.team,
      playerId: headers['x-player-id'],
      wsUrl: data.data?.wsUrl
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Frontend API /join] Error joining match:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to join match'
        },
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}