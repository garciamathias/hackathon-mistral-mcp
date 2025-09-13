# Clash Royale MCP Server

This MCP server allows Mistral AI to play Clash Royale against human players.

## Features

- **2 MCP Tools**:
  - `get_game_state`: Returns complete game state with tactical analysis
  - `spawn_troop`: Places troops on the battlefield

- **HTTP API** for frontend communication
- **Server-Sent Events** for real-time updates
- **Streamable HTTP** transport for Mistral integration

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python server.py
```

The server will be available at `http://localhost:8000`

## Deployment on Alpic.ai

1. Push this directory to a GitHub repository
2. Connect to Alpic.ai and deploy
3. The `pyproject.toml` and `uv.lock` files are configured for Alpic.ai compatibility

## API Endpoints

- `POST /api/game/init` - Initialize a new game
- `GET /api/game/{game_id}/state` - Get current game state
- `POST /api/game/spawn` - Spawn a troop
- `GET /api/game/{game_id}/stream` - SSE stream for real-time updates

## MCP Tools for Mistral

### get_game_state
```json
{
  "game_id": "uuid-here"
}
```

Returns complete game state including:
- All troop positions and health
- Tower status
- Available elixir
- Available cards
- Tactical analysis

### spawn_troop
```json
{
  "game_id": "uuid-here",
  "troop_type": "GIANT",
  "row": 20,
  "col": 8,
  "team": "blue"
}
```

Places a troop on the battlefield if enough elixir is available.