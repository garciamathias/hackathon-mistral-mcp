#!/usr/bin/env python3
"""
Serveur MCP pour le jeu Clash Royale
Compatible avec les spécifications MCP de Mistral AI
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional,  Any
from enum import Enum
import json
import time
import uuid

# Configuration FastAPI
app = FastAPI(
    title="Clash Royale MCP Server",
    description="Serveur MCP pour le jeu Clash Royale - Compatible Mistral AI",
    version="1.0.0"
)

# Configuration CORS pour permettre les connexions externes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums et types de base
class TroopType(str, Enum):
    GIANT = "giant"
    BABY_DRAGON = "babyDragon"
    MINI_PEKKA = "miniPekka"
    VALKYRIE = "valkyrie"

class TroopState(str, Enum):
    SPAWNING = "spawning"
    MOVING_TO_BRIDGE = "moving_to_bridge"
    TARGETING_TOWER = "targeting_tower"
    ATTACKING_TOWER = "attacking_tower"
    DEAD = "dead"

class Team(str, Enum):
    RED = "red"
    BLUE = "blue"

class TowerType(str, Enum):
    KING = "king"
    PRINCESS = "princess"

# Modèles MCP Standard
class MCPTool(BaseModel):
    name: str
    description: str
    inputSchema: Dict[str, Any]

class MCPToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any]

class MCPToolResult(BaseModel):
    content: List[Dict[str, Any]]
    isError: Optional[bool] = False

# Modèles de données du jeu
class Position(BaseModel):
    row: float
    col: float

class TroopConfig(BaseModel):
    max_health: int
    speed: float
    attack_damage: int
    attack_speed: float
    focus_on_buildings: bool
    flying: bool
    scale: float

class TroopData(BaseModel):
    id: str
    type: TroopType
    team: Team
    position: Position
    target_position: Position
    state: TroopState
    health: int
    max_health: int
    speed: float
    is_alive: bool
    bridge_target: Optional[Position] = None
    tower_target: Optional[str] = None
    is_in_combat: bool
    attack_damage: int
    attack_speed: float
    last_attack_time: float
    focus_on_buildings: bool
    flying: bool
    row: float
    col: float

class TowerData(BaseModel):
    id: str
    type: TowerType
    team: Team
    row: int
    col: int
    health: int
    max_health: int
    is_alive: bool
    active: bool
    position: Position

class GameState(BaseModel):
    is_running: bool
    is_paused: bool
    game_time: float
    last_update_time: float

# Configuration des troupes
TROOP_CONFIGS = {
    TroopType.GIANT: TroopConfig(
        max_health=4416,
        speed=1.2,
        attack_damage=253,
        attack_speed=1.9,
        focus_on_buildings=True,
        flying=False,
        scale=3.0
    ),
    TroopType.BABY_DRAGON: TroopConfig(
        max_health=1152,
        speed=2.0,
        attack_damage=161,
        attack_speed=1.05,
        focus_on_buildings=False,
        flying=True,
        scale=2.5
    ),
    TroopType.MINI_PEKKA: TroopConfig(
        max_health=1361,
        speed=1.8,
        attack_damage=720,
        attack_speed=1.8,
        focus_on_buildings=False,
        flying=False,
        scale=2.0
    ),
    TroopType.VALKYRIE: TroopConfig(
        max_health=1908,
        speed=1.5,
        attack_damage=267,
        attack_speed=1.58,
        focus_on_buildings=False,
        flying=False,
        scale=2.2
    )
}

# Configuration des tours
TOWER_CONFIGS = {
    "king": {"max_health": 4824, "damage": 109, "attack_speed": 1.0, "range": 7.0},
    "princess": {"max_health": 3052, "damage": 109, "attack_speed": 1.25, "range": 7.0}
}

# Moteur de jeu global
class GameEngine:
    def __init__(self):
        self.troops: Dict[str, TroopData] = {}
        self.towers: Dict[str, TowerData] = {}
        self.game_state = GameState(
            is_running=False,
            is_paused=False,
            game_time=0.0,
            last_update_time=0.0
        )
        
    def reset(self):
        self.troops.clear()
        self.towers.clear()
        self.game_state = GameState(
            is_running=False,
            is_paused=False,
            game_time=0.0,
            last_update_time=0.0
        )

game_engine = GameEngine()

def initialize_default_towers():
    """Initialise les tours par défaut"""
    towers_config = [
        {"id": "king_red", "type": "king", "team": "red", "row": 2, "col": 8},
        {"id": "king_blue", "type": "king", "team": "blue", "row": 31, "col": 8},
        {"id": "princess_left_red", "type": "princess", "team": "red", "row": 6, "col": 3},
        {"id": "princess_right_red", "type": "princess", "team": "red", "row": 6, "col": 14},
        {"id": "princess_left_blue", "type": "princess", "team": "blue", "row": 27, "col": 3},
        {"id": "princess_right_blue", "type": "princess", "team": "blue", "row": 27, "col": 14}
    ]
    
    for tower_config in towers_config:
        config = TOWER_CONFIGS[tower_config["type"]]
        tower = TowerData(
            id=tower_config["id"],
            type=TowerType(tower_config["type"]),
            team=Team(tower_config["team"]),
            row=tower_config["row"],
            col=tower_config["col"],
            health=config["max_health"],
            max_health=config["max_health"],
            is_alive=True,
            active=True,
            position=Position(row=tower_config["row"], col=tower_config["col"])
        )
        game_engine.towers[tower.id] = tower

# Définition des outils MCP
MCP_TOOLS = [
    MCPTool(
        name="spawn_troop",
        description="Fait apparaître une troupe sur le terrain de jeu",
        inputSchema={
            "type": "object",
            "properties": {
                "troop_type": {
                    "type": "string",
                    "enum": ["giant", "babyDragon", "miniPekka", "valkyrie"],
                    "description": "Type de troupe à faire apparaître"
                },
                "team": {
                    "type": "string",
                    "enum": ["red", "blue"],
                    "description": "Équipe de la troupe"
                },
                "row": {
                    "type": "number",
                    "description": "Position ligne (optionnel)"
                },
                "col": {
                    "type": "number",
                    "description": "Position colonne (optionnel)"
                }
            },
            "required": ["troop_type", "team"]
        }
    ),
    MCPTool(
        name="get_all_troops",
        description="Récupère toutes les troupes actuellement sur le terrain",
        inputSchema={"type": "object", "properties": {}}
    ),
    MCPTool(
        name="get_living_troops",
        description="Récupère toutes les troupes vivantes sur le terrain",
        inputSchema={"type": "object", "properties": {}}
    ),
    MCPTool(
        name="get_troops_by_team",
        description="Récupère toutes les troupes d'une équipe spécifique",
        inputSchema={
            "type": "object",
            "properties": {
                "team": {
                    "type": "string",
                    "enum": ["red", "blue"],
                    "description": "Équipe des troupes à récupérer"
                }
            },
            "required": ["team"]
        }
    ),
    MCPTool(
        name="damage_troop",
        description="Inflige des dégâts à une troupe",
        inputSchema={
            "type": "object",
            "properties": {
                "troop_id": {
                    "type": "string",
                    "description": "ID unique de la troupe"
                },
                "damage": {
                    "type": "integer",
                    "description": "Montant des dégâts à infliger"
                }
            },
            "required": ["troop_id", "damage"]
        }
    ),
    MCPTool(
        name="get_all_towers",
        description="Récupère toutes les tours du jeu",
        inputSchema={"type": "object", "properties": {}}
    ),
    MCPTool(
        name="damage_tower",
        description="Inflige des dégâts à une tour",
        inputSchema={
            "type": "object",
            "properties": {
                "tower_id": {
                    "type": "string",
                    "description": "ID unique de la tour"
                },
                "damage": {
                    "type": "integer",
                    "description": "Montant des dégâts à infliger"
                }
            },
            "required": ["tower_id", "damage"]
        }
    ),
    MCPTool(
        name="start_game",
        description="Démarre une nouvelle partie",
        inputSchema={"type": "object", "properties": {}}
    ),
    MCPTool(
        name="get_game_stats",
        description="Récupère les statistiques complètes du jeu",
        inputSchema={"type": "object", "properties": {}}
    ),
    MCPTool(
        name="reset_game",
        description="Remet le jeu à zéro",
        inputSchema={"type": "object", "properties": {}}
    )
]

# Routes MCP Standard
@app.get("/")
async def root():
    return {"message": "Clash Royale MCP Server", "version": "1.0.0"}

@app.get("/tools")
async def list_tools():
    """Liste tous les outils MCP disponibles"""
    return {"tools": [tool.dict() for tool in MCP_TOOLS]}

@app.post("/tools/call")
async def call_tool(tool_call: MCPToolCall):
    """Exécute un outil MCP"""
    try:
        result = await execute_tool(tool_call.name, tool_call.arguments)
        return MCPToolResult(
            content=[{"type": "text", "text": json.dumps(result, indent=2)}]
        )
    except Exception as e:
        return MCPToolResult(
            content=[{"type": "text", "text": f"Erreur: {str(e)}"}],
            isError=True
        )

async def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Exécute un outil spécifique"""
    
    if tool_name == "spawn_troop":
        return spawn_troop_impl(arguments)
    elif tool_name == "get_all_troops":
        return get_all_troops_impl()
    elif tool_name == "get_living_troops":
        return get_living_troops_impl()
    elif tool_name == "get_troops_by_team":
        return get_troops_by_team_impl(arguments)
    elif tool_name == "damage_troop":
        return damage_troop_impl(arguments)
    elif tool_name == "get_all_towers":
        return get_all_towers_impl()
    elif tool_name == "damage_tower":
        return damage_tower_impl(arguments)
    elif tool_name == "start_game":
        return start_game_impl()
    elif tool_name == "get_game_stats":
        return get_game_stats_impl()
    elif tool_name == "reset_game":
        return reset_game_impl()
    else:
        raise ValueError(f"Outil inconnu: {tool_name}")

# Implémentations des outils
def spawn_troop_impl(args: Dict[str, Any]) -> Dict[str, Any]:
    troop_type = TroopType(args["troop_type"])
    team = Team(args["team"])
    row = args.get("row")
    col = args.get("col")
    
    troop_id = f"{troop_type.value}_{team.value}_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
    config = TROOP_CONFIGS[troop_type]
    
    if row is None or col is None:
        if team == Team.RED:
            default_row, default_col = 0, 8
        else:
            default_row, default_col = 33, 8
        row = row if row is not None else default_row
        col = col if col is not None else default_col
    
    position = Position(row=row, col=col)
    
    troop = TroopData(
        id=troop_id,
        type=troop_type,
        team=team,
        position=position,
        target_position=position,
        state=TroopState.SPAWNING,
        health=config.max_health,
        max_health=config.max_health,
        speed=config.speed,
        is_alive=True,
        is_in_combat=False,
        attack_damage=config.attack_damage,
        attack_speed=config.attack_speed,
        last_attack_time=-1.0,
        focus_on_buildings=config.focus_on_buildings,
        flying=config.flying,
        row=row,
        col=col
    )
    
    game_engine.troops[troop_id] = troop
    
    return {
        "success": True,
        "troop_id": troop_id,
        "troop": troop.dict(),
        "message": f"{troop_type.value} spawned for team {team.value} at ({row}, {col})"
    }

def get_all_troops_impl() -> Dict[str, Any]:
    return {
        "troops": [troop.dict() for troop in game_engine.troops.values()],
        "count": len(game_engine.troops)
    }

def get_living_troops_impl() -> Dict[str, Any]:
    living = [troop.dict() for troop in game_engine.troops.values() if troop.is_alive]
    return {
        "troops": living,
        "count": len(living)
    }

def get_troops_by_team_impl(args: Dict[str, Any]) -> Dict[str, Any]:
    team = Team(args["team"])
    team_troops = [troop.dict() for troop in game_engine.troops.values() if troop.team == team]
    return {
        "troops": team_troops,
        "team": team.value,
        "count": len(team_troops)
    }

def damage_troop_impl(args: Dict[str, Any]) -> Dict[str, Any]:
    troop_id = args["troop_id"]
    damage = args["damage"]
    
    if troop_id not in game_engine.troops:
        return {"success": False, "message": f"Troop {troop_id} not found"}
    
    troop = game_engine.troops[troop_id]
    if not troop.is_alive:
        return {"success": False, "message": f"Troop {troop_id} is already dead"}
    
    troop.health -= damage
    if troop.health <= 0:
        troop.health = 0
        troop.is_alive = False
        troop.state = TroopState.DEAD
    
    return {
        "success": True,
        "troop_id": troop_id,
        "damage_dealt": damage,
        "remaining_health": troop.health,
        "is_alive": troop.is_alive,
        "message": f"Troop {troop_id} took {damage} damage. Health: {troop.health}/{troop.max_health}"
    }

def get_all_towers_impl() -> Dict[str, Any]:
    return {
        "towers": [tower.dict() for tower in game_engine.towers.values()],
        "count": len(game_engine.towers)
    }

def damage_tower_impl(args: Dict[str, Any]) -> Dict[str, Any]:
    tower_id = args["tower_id"]
    damage = args["damage"]
    
    if tower_id not in game_engine.towers:
        return {"success": False, "message": f"Tower {tower_id} not found"}
    
    tower = game_engine.towers[tower_id]
    if not tower.is_alive:
        return {"success": False, "message": f"Tower {tower_id} is already destroyed"}
    
    tower.health -= damage
    if tower.health <= 0:
        tower.health = 0
        tower.is_alive = False
        tower.active = False
    
    return {
        "success": True,
        "tower_id": tower_id,
        "damage_dealt": damage,
        "remaining_health": tower.health,
        "is_alive": tower.is_alive,
        "message": f"Tower {tower_id} took {damage} damage. Health: {tower.health}/{tower.max_health}"
    }

def start_game_impl() -> Dict[str, Any]:
    game_engine.reset()
    initialize_default_towers()
    game_engine.game_state.is_running = True
    game_engine.game_state.is_paused = False
    game_engine.game_state.game_time = 0.0
    game_engine.game_state.last_update_time = time.time()
    
    return {
        "success": True,
        "message": "Game started",
        "game_state": game_engine.game_state.dict(),
        "towers_initialized": len(game_engine.towers)
    }

def get_game_stats_impl() -> Dict[str, Any]:
    all_troops = list(game_engine.troops.values())
    living_troops = [t for t in all_troops if t.is_alive]
    
    return {
        "total_troops": len(all_troops),
        "living_troops": len(living_troops),
        "red_troops": len([t for t in all_troops if t.team == Team.RED]),
        "blue_troops": len([t for t in all_troops if t.team == Team.BLUE]),
        "total_towers": len(game_engine.towers),
        "active_towers": len([t for t in game_engine.towers.values() if t.active and t.is_alive]),
        "game_state": game_engine.game_state.dict()
    }

def reset_game_impl() -> Dict[str, Any]:
    game_engine.reset()
    initialize_default_towers()
    return {
        "success": True,
        "message": "Game reset",
        "game_state": game_engine.game_state.dict(),
        "towers_reset": len(game_engine.towers),
        "troops_cleared": True
    }

# Routes supplémentaires pour faciliter les tests
@app.post("/tools/{tool_name}")
async def call_tool_direct(tool_name: str, arguments: Dict[str, Any] = {}):
    """Route directe pour appeler un outil (facilite les tests)"""
    try:
        result = await execute_tool(tool_name, arguments)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ========================
# WEBSOCKET ENDPOINTS POUR MULTIJOUEUR
# ========================

from fastapi import WebSocket, WebSocketDisconnect
from websocket_manager import websocket_manager

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Endpoint WebSocket pour la communication temps réel avec le jeu Vercel"""
    session_id = None
    try:
        # Connecter le joueur humain
        session_id = await websocket_manager.connect_human_player(websocket)
        
        while True:
            # Attendre les messages du client
            data = await websocket.receive_text()
            await websocket_manager.handle_human_action(websocket, session_id, data)
            
    except WebSocketDisconnect:
        if session_id:
            websocket_manager.disconnect_human_player(session_id)
        print(f"🔌 Human player disconnected from session {session_id}")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        if session_id:
            websocket_manager.disconnect_human_player(session_id)

@app.get("/ws/status")
async def websocket_status():
    """Status des connexions WebSocket actives"""
    return {
        "active_sessions": len(websocket_manager.sessions),
        "active_connections": len(websocket_manager.active_connections),
        "sessions": {
            session_id: {
                "current_player": session.current_player,
                "game_status": session.game_state.get("status", "unknown"),
                "human_connected": session.human_player is not None,
                "mistral_connected": session.mistral_player is not None
            }
            for session_id, session in websocket_manager.sessions.items()
        }
    }

if __name__ == "__main__":
    import uvicorn
    initialize_default_towers()
    print("🎮 Starting Clash Royale MCP Server with WebSocket support...")
    print("🔌 WebSocket endpoint: ws://localhost:8000/ws")
    print("📊 WebSocket status: http://localhost:8000/ws/status")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")