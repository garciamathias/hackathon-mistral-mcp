import { NextResponse } from 'next/server';
import { getSessionHeaders } from '@/lib/session';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mcp-hackthon-production.up.railway.app';

export async function POST() {
  try {
    const headers = await getSessionHeaders();

    const response = await fetch(`${BACKEND_URL}/api/match/create`, {
      method: 'POST',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create match'
        },
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}