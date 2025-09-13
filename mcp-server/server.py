"""
MCP Server for Clash Royale AI vs Player
Allows Mistral to play Clash Royale through MCP tools
"""

from fastmcp import FastMCP
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import asyncio
import uuid
from enum import Enum

# Initialize FastMCP server
mcp = FastMCP("Clash Royale MCP Server")
app = FastAPI()

# Configure CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Game state storage (in production, use Redis or database)
game_states: Dict[str, Dict] = {}

# Troop types enum
class TroopType(str, Enum):
    GIANT = "GIANT"
    BABY_DRAGON = "BABY_DRAGON"
    MINI_PEKKA = "MINI_PEKKA"
    VALKYRIE = "VALKYRIE"

# Models for API
class Position(BaseModel):
    row: int = Field(ge=0, le=33)
    col: int = Field(ge=0, le=17)

class SpawnTroopRequest(BaseModel):
    game_id: str
    troop_type: TroopType
    position: Position
    team: str = Field(pattern="^(red|blue)$")

class GameStateResponse(BaseModel):
    game_id: str
    troops: List[Dict[str, Any]]
    towers: Dict[str, Any]
    elixir: Dict[str, float]
    available_cards: List[str]
    game_time: float
    tactical_analysis: str
    is_game_over: bool
    winner: Optional[str]

# Helper functions
def analyze_tactical_situation(game_state: Dict) -> str:
    """Analyze the current game state and provide tactical insights"""
    analysis = []

    # Count troops per team
    red_troops = sum(1 for t in game_state.get("troops", []) if t.get("team") == "red")
    blue_troops = sum(1 for t in game_state.get("troops", []) if t.get("team") == "blue")

    if red_troops > blue_troops:
        analysis.append(f"Red has troop advantage ({red_troops} vs {blue_troops})")
    elif blue_troops > red_troops:
        analysis.append(f"Blue has troop advantage ({blue_troops} vs {red_troops})")
    else:
        analysis.append("Equal troop count on battlefield")

    # Check tower health
    towers = game_state.get("towers", {})
    for tower_id, tower_data in towers.items():
        if tower_data.get("health", 100) < 30:
            team = tower_data.get("team", "unknown")
            analysis.append(f"{team.capitalize()} {tower_data.get('type', 'tower')} is critically damaged!")

    # Elixir advantage
    elixir = game_state.get("elixir", {})
    if elixir.get("blue", 0) > elixir.get("red", 0) + 2:
        analysis.append("Blue has significant elixir advantage")
    elif elixir.get("red", 0) > elixir.get("blue", 0) + 2:
        analysis.append("Red has significant elixir advantage")

    # Suggest strategy based on game time
    game_time = game_state.get("game_time", 0)
    if game_time < 60:
        analysis.append("Early game: Focus on elixir trades and chip damage")
    elif game_time < 120:
        analysis.append("Mid game: Build pushes and apply pressure")
    else:
        analysis.append("Late game: Time for aggressive plays or defend the lead")

    return ". ".join(analysis) if analysis else "Balanced game state"

def initialize_game_state(game_id: str) -> Dict:
    """Initialize a new game state"""
    return {
        "game_id": game_id,
        "troops": [],
        "towers": {
            "king_red": {
                "id": "king_red",
                "team": "red",
                "type": "king",
                "health": 100,
                "max_health": 100,
                "position": {"row": 2, "col": 8}
            },
            "princess_red_left": {
                "id": "princess_red_left",
                "team": "red",
                "type": "princess",
                "health": 100,
                "max_health": 100,
                "position": {"row": 6, "col": 3}
            },
            "princess_red_right": {
                "id": "princess_red_right",
                "team": "red",
                "type": "princess",
                "health": 100,
                "max_health": 100,
                "position": {"row": 6, "col": 14}
            },
            "king_blue": {
                "id": "king_blue",
                "team": "blue",
                "type": "king",
                "health": 100,
                "max_health": 100,
                "position": {"row": 31, "col": 8}
            },
            "princess_blue_left": {
                "id": "princess_blue_left",
                "team": "blue",
                "type": "princess",
                "health": 100,
                "max_health": 100,
                "position": {"row": 27, "col": 3}
            },
            "princess_blue_right": {
                "id": "princess_blue_right",
                "team": "blue",
                "type": "princess",
                "health": 100,
                "max_health": 100,
                "position": {"row": 27, "col": 14}
            }
        },
        "elixir": {"red": 5.0, "blue": 5.0},
        "max_elixir": 10.0,
        "elixir_rate": 1.0,  # per second
        "available_cards": ["GIANT", "BABY_DRAGON", "MINI_PEKKA", "VALKYRIE"],
        "game_time": 0.0,
        "start_time": datetime.now().isoformat(),
        "is_game_over": False,
        "winner": None
    }

def get_troop_cost(troop_type: str) -> float:
    """Get elixir cost for a troop type"""
    costs = {
        "GIANT": 5.0,
        "BABY_DRAGON": 4.0,
        "MINI_PEKKA": 4.0,
        "VALKYRIE": 4.0
    }
    return costs.get(troop_type, 3.0)

# Business logic functions (separate from MCP tools)
def get_game_state_logic(game_id: str) -> Dict:
    """Get the complete game state (business logic)"""
    if game_id not in game_states:
        game_states[game_id] = initialize_game_state(game_id)

    state = game_states[game_id]

    # Update game time
    if not state["is_game_over"]:
        start_time = datetime.fromisoformat(state["start_time"])
        state["game_time"] = (datetime.now() - start_time).total_seconds()

        # Update elixir (simplified - in real game would be more complex)
        for team in ["red", "blue"]:
            current_elixir = state["elixir"][team]
            if current_elixir < state["max_elixir"]:
                state["elixir"][team] = min(
                    state["max_elixir"],
                    current_elixir + (state["elixir_rate"] * 0.5)  # Update every 0.5 seconds
                )

    # Add tactical analysis
    state["tactical_analysis"] = analyze_tactical_situation(state)

    return state

def spawn_troop_logic(
    game_id: str,
    troop_type: str,
    row: int,
    col: int,
    team: str
) -> Dict:
    """Spawn a troop on the battlefield (business logic)"""
    print(f"spawn_troop_logic called with: game_id={game_id}, troop_type={troop_type}, row={row}, col={col}, team={team}")

    if game_id not in game_states:
        print(f"Game {game_id} not found, creating new game state")
        game_states[game_id] = initialize_game_state(game_id)

    state = game_states[game_id]

    # Check if game is over
    if state["is_game_over"]:
        print(f"Game {game_id} is over, cannot spawn")
        return {
            "success": False,
            "error": "Game is over",
            "state": state
        }

    # Check elixir cost
    troop_cost = get_troop_cost(troop_type)
    current_elixir = state["elixir"][team]
    print(f"Elixir check: {team} team has {current_elixir}, troop costs {troop_cost}")

    if current_elixir < troop_cost:
        print(f"Not enough elixir for {team} team")
        return {
            "success": False,
            "error": f"Not enough elixir. Need {troop_cost}, have {current_elixir}",
            "state": state
        }

    # Validate spawn position (simplified - in real game would check valid spawn zones)
    print(f"Position validation: {team} team trying to spawn at row {row}")

    if team == "red" and row > 16:
        print(f"Red team cannot spawn at row {row} (must be 0-16)")
        return {
            "success": False,
            "error": "Red team can only spawn in their half (rows 0-16)",
            "state": state
        }
    elif team == "blue" and row < 17:
        print(f"Blue team cannot spawn at row {row} (must be 17-33)")
        return {
            "success": False,
            "error": "Blue team can only spawn in their half (rows 17-33)",
            "state": state
        }

    # Spawn the troop
    troop = {
        "id": f"{troop_type}_{team}_{len(state['troops'])}_{uuid.uuid4().hex[:8]}",
        "type": troop_type,
        "team": team,
        "position": {"row": row, "col": col},
        "health": 100,
        "max_health": 100,
        "spawned_at": datetime.now().isoformat()
    }

    state["troops"].append(troop)
    state["elixir"][team] -= troop_cost

    print(f"✅ Successfully spawned {troop_type} at ({row}, {col}) for {team} team")
    print(f"Remaining elixir for {team}: {state['elixir'][team]}")

    return {
        "success": True,
        "message": f"Spawned {troop_type} at ({row}, {col}) for team {team}",
        "troop": troop,
        "remaining_elixir": state["elixir"][team],
        "state": state
    }

# MCP Tools (now they just call the business logic)
@mcp.tool
async def get_game_state(game_id: str) -> Dict:
    """
    Get the complete game state including all tactical information.
    This provides everything needed for AI decision making.

    Args:
        game_id: The unique identifier for the game session

    Returns:
        Complete game state with tactical analysis
    """
    return get_game_state_logic(game_id)

@mcp.tool
async def spawn_troop(
    game_id: str,
    troop_type: TroopType,
    row: int = Field(ge=0, le=33),
    col: int = Field(ge=0, le=17),
    team: str = Field(pattern="^(red|blue)$")
) -> Dict:
    """
    Spawn a troop on the battlefield.

    Args:
        game_id: The unique identifier for the game session
        troop_type: Type of troop to spawn (GIANT, BABY_DRAGON, MINI_PEKKA, VALKYRIE)
        row: Row position (0-33)
        col: Column position (0-17)
        team: Team color (red or blue)

    Returns:
        Success status and updated game state
    """
    return spawn_troop_logic(game_id, troop_type.value, row, col, team)

# HTTP API Endpoints (now they call the business logic directly)
@app.post("/api/game/init")
async def init_game():
    """Initialize a new game session"""
    game_id = str(uuid.uuid4())
    game_states[game_id] = initialize_game_state(game_id)
    return {"game_id": game_id, "message": "Game initialized"}

@app.get("/api/game/{game_id}/state")
async def get_game_state_api(game_id: str):
    """Get current game state via HTTP"""
    if game_id not in game_states:
        raise HTTPException(status_code=404, detail="Game not found")

    state = get_game_state_logic(game_id)
    return GameStateResponse(**state)

@app.post("/api/game/spawn")
async def spawn_troop_api(request: SpawnTroopRequest):
    """Spawn a troop via HTTP"""
    print(f"=== SPAWN REQUEST RECEIVED ===")
    print(f"Game ID: {request.game_id}")
    print(f"Troop Type: {request.troop_type}")
    print(f"Position: row={request.position.row}, col={request.position.col}")
    print(f"Team: {request.team}")

    result = spawn_troop_logic(
        game_id=request.game_id,
        troop_type=request.troop_type.value,
        row=request.position.row,
        col=request.position.col,
        team=request.team
    )

    print(f"Spawn result: {result}")
    return result

@app.get("/api/game/{game_id}/stream")
async def stream_game_state(game_id: str):
    """Stream game state updates via Server-Sent Events"""
    async def event_generator():
        while True:
            if game_id in game_states:
                state = get_game_state_logic(game_id)
                yield f"data: {json.dumps(state)}\n\n"
            await asyncio.sleep(0.5)  # Send updates every 500ms

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {"status": "healthy", "service": "clash-royale-mcp"}

# Create MCP endpoint for handling MCP protocol
@app.post("/mcp")
async def handle_mcp(request: dict):
    """Handle MCP protocol messages"""
    return await mcp.handle_request(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)