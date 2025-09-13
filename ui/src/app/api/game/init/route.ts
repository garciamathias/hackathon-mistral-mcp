import { NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8000';

export async function POST() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/api/game/init`, {
      method: 'POST',
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
    console.error('Error initializing game:', error);
    return NextResponse.json(
      { error: 'Failed to initialize game' },
      { status: 500 }
    );
  }
}