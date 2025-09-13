import { NextRequest } from 'next/server';

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get('game_id');

  if (!gameId) {
    return new Response('game_id is required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${MCP_SERVER_URL}/api/game/${gameId}/stream`);

        if (!response.ok || !response.body) {
          throw new Error('Failed to connect to MCP server');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const text = decoder.decode(value, { stream: true });
          controller.enqueue(encoder.encode(text));
        }
      } catch (error) {
        console.error('SSE stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}