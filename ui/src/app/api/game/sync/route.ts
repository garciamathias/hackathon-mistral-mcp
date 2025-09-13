import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('=== SYNC REQUEST TO PYTHON SERVER ===');
    console.log('Game ID:', body.game_id);
    console.log('Troops count:', body.troops?.length || 0);
    console.log('Game over:', body.is_game_over);

    // Send state to Python server and get AI actions
    const response = await fetch(`${MCP_SERVER_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id: body.game_id,
        troops: body.troops || [],
        towers: body.towers || {},
        is_game_over: body.is_game_over || false,
        winner: body.winner || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python server error:', errorText);
      return NextResponse.json(
        { error: 'Failed to sync with Python server' },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log('=== SYNC RESPONSE FROM PYTHON SERVER ===');
    console.log('AI actions:', data.ai_actions?.length || 0);
    console.log('Tactical analysis:', data.tactical_analysis);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/game/sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}