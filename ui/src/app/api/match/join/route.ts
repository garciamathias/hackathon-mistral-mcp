import { NextRequest, NextResponse } from 'next/server';
import { getSessionHeaders } from '@/lib/session';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = await getSessionHeaders();

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

    console.log('[Frontend API /join] Successfully joined match:', {
      matchId: body.matchId,
      team: data.data?.team,
      playerId: headers['x-player-id']
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