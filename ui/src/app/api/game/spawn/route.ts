import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log what we're sending to the Python server
    console.log('=== SPAWN REQUEST TO PYTHON SERVER ===');
    console.log('URL:', `${MCP_SERVER_URL}/api/game/spawn`);
    console.log('Body:', JSON.stringify(body, null, 2));

    const response = await fetch(`${MCP_SERVER_URL}/api/game/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log('Python server response status:', response.status);
    console.log('Python server response:', responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      return NextResponse.json(
        { error: 'Invalid response from server', details: responseText },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Python server returned error:', data);
      // Return the actual error from Python server
      return NextResponse.json(data, { status: response.status });
    }

    console.log('Spawn successful:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in spawn route:', error);
    return NextResponse.json(
      {
        error: 'Failed to spawn troop',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}