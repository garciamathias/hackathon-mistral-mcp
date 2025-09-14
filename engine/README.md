# 🎮 Clash Royale Game Engine - Backend Server

Real-time authoritative game server for a Clash Royale-like multiplayer game, built with Node.js, Express, TypeScript, and WebSockets.

## 🚀 Features

- **Real-time Game Loop**: 10Hz server tick rate (100ms intervals)
- **WebSocket Communication**: Live game state broadcasting to all clients
- **REST API**: HTTP endpoints for game actions and state queries
- **TypeScript**: Strict mode with shared types between client and server
- **Authoritative Server**: All game logic validated server-side
- **Multi-room Support**: Handle multiple concurrent matches
- **Railway Ready**: Configured for easy deployment

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- TypeScript 5+

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

## 🏃 Running the Server

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck
```

## 🌐 API Endpoints

### Match Management
- `POST /api/match/create` - Create a new match
- `POST /api/match/join` - Join an existing match
- `GET /api/match/:matchId` - Get match information
- `GET /api/match` - List all active matches

### Game Actions
- `POST /api/game/play_card` - Deploy a troop
- `GET /api/game/state/:matchId` - Get current game state
- `POST /api/game/action` - Perform game action (pause/resume)
- `GET /api/game/troops` - Get available troops info

### Health Check
- `GET /health` - Server health status
- `GET /api` - API documentation

## 🔌 WebSocket Protocol

Connect to: `ws://localhost:3001?roomId={matchId}&playerId={playerId}`

### Client → Server Messages
```typescript
{
  type: 'PLAY_CARD',
  data: {
    troopType: 'giant' | 'babyDragon' | 'miniPekka' | 'valkyrie',
    position: { row: number, col: number }
  }
}
```

### Server → Client Messages
```typescript
{
  type: 'GAME_SNAPSHOT',
  data: {
    snapshot: {
      timestamp: number,
      tick: number,
      troops: TroopData[],
      towers: TowerData[],
      players: PlayerState[]
    }
  }
}
```

## 🏗️ Architecture

```
/engine/
├── src/
│   ├── server.ts           # Main entry point
│   ├── config/
│   │   └── constants.ts    # Game constants
│   ├── types/
│   │   ├── shared/         # Shared types (client/server)
│   │   └── server.ts       # Server-specific types
│   ├── core/
│   │   ├── GameEngine.ts   # Game logic
│   │   ├── GameRoom.ts     # Match management
│   │   └── TickManager.ts  # Game loop controller
│   ├── api/
│   │   ├── routes/         # REST endpoints
│   │   └── middleware/     # Express middleware
│   └── websocket/
│       └── WSManager.ts    # WebSocket handler
```

## 🎮 Game Configuration

- **Tick Rate**: 10 Hz (100ms per tick)
- **Grid Size**: 34 rows × 18 columns
- **Max Players**: 2 per room
- **Elixir**: 10 max, regenerates at 1/2.8s
- **Game Duration**: 3 minutes + 1 minute overtime

## 🚢 Deployment

### Railway
```bash
# Deploy to Railway
railway up

# Set environment variables
railway variables set CORS_ORIGIN=https://your-frontend.com
```

### Docker
```bash
# Build image
docker build -t clash-royale-server .

# Run container
docker run -p 3001:3001 clash-royale-server
```

## 🔧 Environment Variables

```env
NODE_ENV=production
PORT=3001
WS_PORT=3001
CORS_ORIGIN=https://your-frontend.com
```

## 📊 Performance

- Handles 100+ concurrent game rooms
- 10Hz tick rate for smooth gameplay
- WebSocket broadcast optimization
- Efficient game state snapshots

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

MIT