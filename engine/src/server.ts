import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WSManager } from '@websocket/WSManager';
import { createMatchRoutes } from '@api/routes/match';
import { createGameRoutes } from '@api/routes/game';
import { SERVER_CONFIG } from '@config/constants';
import { MCPGameManager } from '@/mcp/gameManager';
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
import { getMCPServer } from '@/mcp/mcpServerNew';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || SERVER_CONFIG.DEFAULT_PORT;
const WS_PORT = process.env.WS_PORT || PORT; // Use same port for HTTP and WS

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// API Info endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'Clash Royale Game Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      matches: {
        create: 'POST /api/match/create',
        join: 'POST /api/match/join',
        info: 'GET /api/match/:matchId',
        list: 'GET /api/match'
      },
      game: {
        playCard: 'POST /api/game/play_card',
        state: 'GET /api/game/state/:matchId',
        action: 'POST /api/game/action',
        troops: 'GET /api/game/troops'
      },
      mcp: {
        endpoint: 'POST /mcp',
        tools: 'GET /mcp/tools'
      }
    },
    websocket: {
      url: `ws://localhost:${WS_PORT}`,
      params: {
        roomId: 'Match room ID',
        playerId: 'Player ID'
      }
    }
  });
});

// Initialize managers as placeholders
let wsManager: WSManager;
let mcpGameManager: MCPGameManager;
let matchRouter: any;
let gameRouter: any;

// Setup API route placeholders
app.use('/api/match', (req, res, next) => {
  if (!matchRouter) {
    return res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Server is starting up, please try again' },
      timestamp: Date.now()
    });
  }
  return matchRouter(req, res, next);
});

app.use('/api/game', (req, res, next) => {
  if (!gameRouter) {
    return res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Server is starting up, please try again' },
      timestamp: Date.now()
    });
  }
  return gameRouter(req, res, next);
});

// MCP Endpoint using SDK
app.post('/mcp', async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close();
    });

    const server = getMCPServer(mcpGameManager);
    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// MCP GET endpoint (method not allowed)
app.get('/mcp', (_req, res) => {
  console.log('Received GET MCP request');
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed. Use POST.',
    },
    id: null,
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    },
    timestamp: Date.now()
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    },
    timestamp: Date.now()
  });
});

// Start server
httpServer.listen(PORT, () => {
  // Initialize WebSocket Manager after server is listening
  wsManager = new WSManager(httpServer);
  mcpGameManager = new MCPGameManager(wsManager);

  // Now initialize the routes with the actual wsManager
  matchRouter = createMatchRoutes(wsManager);
  gameRouter = createGameRoutes(wsManager);
  console.log(`
╔════════════════════════════════════════════╗
║   🎮 Clash Royale Game Server Started! 🎮   ║
╚════════════════════════════════════════════╝

🌐 HTTP Server:    http://localhost:${PORT}
🔌 WebSocket:      ws://localhost:${WS_PORT}
🎯 Environment:    ${process.env.NODE_ENV || 'development'}
⏱️  Tick Rate:      ${SERVER_CONFIG.TICK_RATE} Hz
👥 Max Players:    ${SERVER_CONFIG.MAX_PLAYERS_PER_ROOM} per room
🏠 Max Rooms:      ${SERVER_CONFIG.MAX_ROOMS}

API Endpoints:
  - POST /api/match/create     Create new match
  - POST /api/match/join       Join existing match
  - POST /api/game/play_card   Play a card
  - GET  /api/game/state/:id   Get game state
  - GET  /health               Health check

Press Ctrl+C to stop the server
  `);

  console.log('✅ WebSocket Manager initialized and ready for connections');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  if (wsManager) wsManager.shutdown();
  httpServer.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  if (wsManager) wsManager.shutdown();
  httpServer.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

export default app;