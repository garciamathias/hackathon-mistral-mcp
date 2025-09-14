import { NextResponse } from 'next/server';
import { getSessionHeaders } from '@/lib/session';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const headers = await getSessionHeaders();

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