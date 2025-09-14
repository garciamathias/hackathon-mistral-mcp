import { NextResponse } from 'next/server';
import { getSessionHeaders } from '@/lib/session';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

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