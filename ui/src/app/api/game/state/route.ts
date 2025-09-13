import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get('game_id');

  if (!gameId) {
    return NextResponse.json(
      { error: 'game_id is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${MCP_SERVER_URL}/api/game/${gameId}/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MCP server responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting game state:', error);
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    );
  }
}